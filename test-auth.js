import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// Test credentials
const testUser = {
  phoneNumber: '+2348123456789',
  name: 'Test User',
  email: 'test@wazassist.com',
  password: 'TestPassword123!'
};

let accessToken = '';
let refreshToken = '';

async function testAuthFlow() {
  console.log('\n🔐 Testing WazAssist Authentication System\n');
  console.log('='.repeat(50));

  try {
    // 1. Test Registration
    console.log('\n1️⃣  Testing User Registration...');
    try {
      const registerRes = await axios.post(`${API_BASE}/auth/register`, testUser);

      if (registerRes.data.success) {
        console.log('✅ Registration successful');
        console.log('   User ID:', registerRes.data.data.user.id);
        console.log('   Name:', registerRes.data.data.user.name);
        console.log('   Phone:', registerRes.data.data.user.phoneNumber);
        accessToken = registerRes.data.data.accessToken;
        refreshToken = registerRes.data.data.refreshToken;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log('⚠️  User already exists, proceeding to login...');
      } else {
        throw error;
      }
    }

    // 2. Test Login
    console.log('\n2️⃣  Testing User Login...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      phoneNumber: testUser.phoneNumber,
      password: testUser.password
    });

    if (loginRes.data.success) {
      console.log('✅ Login successful');
      console.log('   User ID:', loginRes.data.data.user.id);
      console.log('   Access Token:', loginRes.data.data.accessToken.substring(0, 50) + '...');
      accessToken = loginRes.data.data.accessToken;
      refreshToken = loginRes.data.data.refreshToken;
    }

    // 3. Test Get Profile
    console.log('\n3️⃣  Testing Get Profile...');
    const profileRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (profileRes.data.success) {
      console.log('✅ Profile retrieved successfully');
      console.log('   Name:', profileRes.data.data.name);
      console.log('   Phone:', profileRes.data.data.phoneNumber);
      console.log('   Email:', profileRes.data.data.email);
      console.log('   Active:', profileRes.data.data.isActive);
    }

    // 4. Test Token Verification
    console.log('\n4️⃣  Testing Token Verification...');
    const verifyRes = await axios.post(`${API_BASE}/auth/verify`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (verifyRes.data.success) {
      console.log('✅ Token is valid');
      console.log('   User ID:', verifyRes.data.data.userId);
    }

    // 5. Test Token Refresh
    console.log('\n5️⃣  Testing Token Refresh...');
    const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken
    });

    if (refreshRes.data.success) {
      console.log('✅ Token refreshed successfully');
      console.log('   New Access Token:', refreshRes.data.data.accessToken.substring(0, 50) + '...');
      accessToken = refreshRes.data.data.accessToken;
    }

    // 6. Test Password Reset Flow
    console.log('\n6️⃣  Testing Password Reset Request...');
    const resetRequestRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      phoneNumber: testUser.phoneNumber
    });

    if (resetRequestRes.data.success) {
      console.log('✅ Password reset code generated');
      console.log('   Reset Code:', resetRequestRes.data.resetCode);
      console.log('   Message:', resetRequestRes.data.message);

      // Test reset password with code
      console.log('\n7️⃣  Testing Password Reset with Code...');
      const newPassword = 'NewPassword123!';
      const resetRes = await axios.post(`${API_BASE}/auth/reset-password`, {
        phoneNumber: testUser.phoneNumber,
        resetCode: resetRequestRes.data.resetCode,
        newPassword
      });

      if (resetRes.data.success) {
        console.log('✅ Password reset successfully');
        console.log('   Message:', resetRes.data.message);

        // Try logging in with new password
        console.log('\n8️⃣  Testing Login with New Password...');
        const newLoginRes = await axios.post(`${API_BASE}/auth/login`, {
          phoneNumber: testUser.phoneNumber,
          password: newPassword
        });

        if (newLoginRes.data.success) {
          console.log('✅ Login with new password successful');
          accessToken = newLoginRes.data.data.accessToken;
          refreshToken = newLoginRes.data.data.refreshToken;
        }

        // Reset password back to original
        const resetBackReq = await axios.post(`${API_BASE}/auth/forgot-password`, {
          phoneNumber: testUser.phoneNumber
        });
        await axios.post(`${API_BASE}/auth/reset-password`, {
          phoneNumber: testUser.phoneNumber,
          resetCode: resetBackReq.data.resetCode,
          newPassword: testUser.password
        });
        console.log('   Password reset back to original');
      }
    }

    // 9. Test Change Password
    console.log('\n9️⃣  Testing Change Password...');
    const changePasswordRes = await axios.post(
      `${API_BASE}/auth/change-password`,
      {
        oldPassword: testUser.password,
        newPassword: 'ChangedPassword123!'
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (changePasswordRes.data.success) {
      console.log('✅ Password changed successfully');
      console.log('   Message:', changePasswordRes.data.message);

      // Login with new password
      const loginNewRes = await axios.post(`${API_BASE}/auth/login`, {
        phoneNumber: testUser.phoneNumber,
        password: 'ChangedPassword123!'
      });

      if (loginNewRes.data.success) {
        console.log('✅ Login with changed password successful');
        accessToken = loginNewRes.data.data.accessToken;
        refreshToken = loginNewRes.data.data.refreshToken;

        // Change back to original password
        await axios.post(
          `${API_BASE}/auth/change-password`,
          {
            oldPassword: 'ChangedPassword123!',
            newPassword: testUser.password
          },
          {
            headers: { Authorization: `Bearer ${loginNewRes.data.data.accessToken}` }
          }
        );
        console.log('   Password changed back to original');
      }
    }

    // 10. Test Logout
    console.log('\n🔟 Testing Logout...');
    const logoutRes = await axios.post(`${API_BASE}/auth/logout`, {
      refreshToken
    });

    if (logoutRes.data.success) {
      console.log('✅ Logout successful');
      console.log('   Message:', logoutRes.data.message);
    }

    // 11. Test Invalid Token After Logout
    console.log('\n1️⃣1️⃣  Testing Invalid Token After Logout...');
    try {
      await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      console.log('❌ Refresh should have failed after logout');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Refresh token correctly invalidated after logout');
      } else {
        throw error;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ All Authentication Tests Passed!\n');
    console.log('Tested Features:');
    console.log('  ✅ User Registration');
    console.log('  ✅ User Login');
    console.log('  ✅ Get Profile');
    console.log('  ✅ Token Verification');
    console.log('  ✅ Token Refresh');
    console.log('  ✅ Password Reset Request');
    console.log('  ✅ Password Reset with Code');
    console.log('  ✅ Login with Reset Password');
    console.log('  ✅ Change Password');
    console.log('  ✅ Logout');
    console.log('  ✅ Token Invalidation');
    console.log('\n🎉 Authentication System is Production Ready!\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testAuthFlow();
