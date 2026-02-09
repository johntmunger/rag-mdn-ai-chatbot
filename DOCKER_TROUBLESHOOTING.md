# Docker Troubleshooting - "docker: command not found"

## Issue

When running `npm run db:up`, you see:
```
sh: docker: command not found
```

## Solution

Docker Desktop is installed but not running. Follow these steps:

### Step 1: Start Docker Desktop

**Option A: Using Finder**
1. Open **Finder**
2. Go to **Applications** folder (Cmd + Shift + A)
3. Find **Docker.app**
4. Double-click to start Docker Desktop

**Option B: Using Spotlight**
1. Press **Cmd + Space** (Spotlight)
2. Type "Docker"
3. Press **Enter** to launch

### Step 2: Wait for Docker to Start

Look for the Docker icon in your menu bar (top-right of screen):
- 🐋 **Whale icon** means Docker is starting
- Wait until the whale stops animating
- Click the icon and verify it says "Docker Desktop is running"

This usually takes **15-30 seconds** on first launch.

### Step 3: Verify Docker is Ready

Run the check script:

```bash
npm run db:check
```

You should see:
```
✅ Docker command found
✅ Docker daemon is running
✅ Version: Docker version X.X.X
🎉 Docker is ready to use!
```

### Step 4: Start Your Database

```bash
npm run db:up
```

Should now show:
```
✅ Container rag-mdn-postgres  Started
```

## Quick Verification Commands

```bash
# Check if Docker command is available
which docker

# Check if Docker is running
docker info

# Check if containers are running
docker ps

# Test with our database
npm run db:status
```

## Common Issues

### Issue: Docker Desktop won't start

**Solution**: Check system requirements
- macOS 11 or newer
- At least 4GB RAM available
- Internet connection for first launch

### Issue: Docker command not found even after starting Desktop

**Solution**: Restart your terminal
```bash
# Close and reopen your terminal, then test:
which docker
```

### Issue: Docker Desktop is running but containers won't start

**Solution**: Check Docker Desktop settings
1. Click Docker icon in menu bar
2. Go to **Settings** → **Resources**
3. Ensure sufficient memory allocated (at least 2GB)
4. Click **Apply & Restart**

### Issue: Port 5455 already in use

**Solution**: Check what's using the port
```bash
lsof -i :5455

# If something is using it, stop it or change port in docker-compose.yml
```

## Alternative: Using Postgres.app (If Docker Issues Persist)

If you can't get Docker working, you can use Postgres.app instead:

1. Download from: https://postgresapp.com/
2. Install and start Postgres.app
3. Install pgvector extension:
   ```bash
   psql -d postgres -c "CREATE EXTENSION vector;"
   ```
4. Update .env:
   ```env
   DATABASE_URL=postgresql://localhost:5432/postgres
   ```

## Next Steps After Docker is Running

1. ✅ Start Docker Desktop (manual)
2. ✅ Verify with `npm run db:check`
3. ✅ Start database: `npm run db:up`
4. ✅ Push schema: `npm run db:push`
5. ✅ Ready for embedding generation!

## Still Having Issues?

Run this diagnostic:

```bash
# Check all Docker-related info
echo "=== Docker App ==="
ls -la /Applications/Docker.app

echo -e "\n=== Docker Command ==="
which docker || echo "Not found"

echo -e "\n=== Docker Process ==="
ps aux | grep -i docker | grep -v grep || echo "Not running"

echo -e "\n=== Docker Socket ==="
ls -la /var/run/docker.sock 2>/dev/null || echo "Socket not found"
```

Share the output if you need help debugging!
