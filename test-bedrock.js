import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const prompt = "Hello! Respond with just 'Working perfectly!' if you can read this.";

const payload = {
  prompt: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`,
  max_gen_len: 100,
  temperature: 0.7,
  top_p: 0.9
};

try {
  console.log("🧪 Testing AWS Bedrock connection...");
  console.log("📡 Region: us-east-1");
  console.log("🤖 Model: meta.llama3-1-8b-instruct-v1:0");
  
  const command = new InvokeModelCommand({
    modelId: "us.meta.llama3-1-8b-instruct-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  
  console.log("\n✅ SUCCESS! AWS Bedrock is working!");
  console.log("📝 Response:", result.generation?.trim() || result);
  console.log("🎯 Tokens used:", result.prompt_token_count + result.generation_token_count);
  console.log("\n🚀 Ready for production!");
  
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  if (error.name === 'AccessDeniedException') {
    console.log("\n⚠️  You need to request model access in AWS Console:");
    console.log("   1. Go to https://console.aws.amazon.com/bedrock");
    console.log("   2. Click 'Model access' in left sidebar");
    console.log("   3. Click 'Request access' for Meta Llama models");
  }
}
