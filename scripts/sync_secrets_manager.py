import json
import os
import pathlib
import re
import subprocess
import tempfile


def main() -> None:
    env_path = pathlib.Path('.env.production')
    lines = env_path.read_text().splitlines()

    secret = {}
    placeholder_patterns = [
        re.compile(r'^\s*$'),
        re.compile(r'^(your-|YOUR-|placeholder)', re.I),
        re.compile(r'\.\.\.'),
    ]

    non_secret_keys = {
        'NODE_ENV', 'PORT', 'APP_NAME', 'APP_BASE_URL', 'FRONTEND_URL',
        'API_URL', 'WEBHOOK_BASE_URL', 'LOG_LEVEL', 'LOG_FILE',
        'AWS_SECRETS_MANAGER_SECRET_ID'
    }

    for raw in lines:
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue

        key, val = line.split('=', 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")

        if key in non_secret_keys:
            continue
        if any(p.search(val) for p in placeholder_patterns):
            continue
        if not val:
            continue

        secret[key] = val

    name = 'wazassist/prod/app'
    payload = json.dumps(secret)

    check = subprocess.run(
        ['aws', 'secretsmanager', 'describe-secret', '--region', 'us-east-1', '--secret-id', name],
        capture_output=True,
        text=True,
    )

    with tempfile.NamedTemporaryFile('w', delete=False) as f:
        f.write(payload)
        tmp_path = f.name

    try:
        if check.returncode == 0:
            subprocess.check_call([
                'aws', 'secretsmanager', 'put-secret-value',
                '--region', 'us-east-1',
                '--secret-id', name,
                '--secret-string', f'file://{tmp_path}'
            ])
            print(f'updated {name} keys={len(secret)}')
        else:
            subprocess.check_call([
                'aws', 'secretsmanager', 'create-secret',
                '--region', 'us-east-1',
                '--name', name,
                '--secret-string', f'file://{tmp_path}'
            ])
            print(f'created {name} keys={len(secret)}')
    finally:
        os.unlink(tmp_path)


if __name__ == '__main__':
    main()
