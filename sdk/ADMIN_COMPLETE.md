# MiniHub Admin Tool - Complete Documentation

## 🎉 Installation Complete!

Your MiniHub Admin CLI tool has been successfully created and built!

## 📁 What Was Created

### Core Files

1. **`admin.ts`** - Main admin CLI tool (1000+ lines)
   - Configuration management
   - System statistics
   - Job management commands
   - User & employer management
   - Event monitoring
   - Data export functionality
   - Live monitoring

2. **`minihub.ts`** - Updated SDK with transaction support
   - Fixed for @mysten/sui v1.11.0 compatibility
   - Proper Option<T> encoding
   - BCS serialization for vectors
   - All transaction builders updated

### Documentation Files

1. **`ADMIN_README.md`** - Complete documentation
   - Full feature list
   - Detailed command reference
   - Configuration guide
   - Troubleshooting section

2. **`ADMIN_QUICKSTART.md`** - Quick start guide
   - 5-minute setup instructions
   - Common commands
   - Example workflows

3. **`ADMIN_EXAMPLES.md`** - Real-world usage examples
   - 13 detailed scenarios
   - Shell scripts for automation
   - Best practices

4. **`minihub.config.example.json`** - Configuration template
   - Example structure
   - Field descriptions

5. **`setup-admin.sh`** - Setup automation script
   - One-command installation
   - Dependency checking
   - Build automation

## 🚀 Quick Start

### 1. Initialize Configuration

```bash
cd sdk
yarn admin config init \
  --network testnet \
  --package 0xYOUR_PACKAGE_ID \
  --job-board 0xYOUR_JOBBOARD_ID \
  --user-registry 0xYOUR_USERREGISTRY_ID \
  --employer-registry 0xYOUR_EMPLOYERREGISTRY_ID
```

### 2. Verify Setup

```bash
yarn admin config show
```

### 3. Check System Status

```bash
yarn admin stats
```

## 📊 Key Features

### Configuration Management
- `yarn admin config init` - Initialize config
- `yarn admin config show` - View current config
- `yarn admin config update` - Update settings

### System Monitoring
- `yarn admin stats` - System statistics
- `yarn admin stats --detailed` - Detailed stats
- `yarn admin monitor` - Live monitoring

### Job Management
- `yarn admin jobs list` - List all jobs
- `yarn admin jobs list --active` - Active jobs only
- `yarn admin jobs view <id>` - View job details
- `yarn admin jobs search <query>` - Search jobs

### User Management
- `yarn admin users list` - List users
- `yarn admin users view <id>` - View profile
- `yarn admin users search <skills>` - Search by skills

### Employer Management
- `yarn admin employers list` - List employers
- `yarn admin employers view <id>` - View profile
- `yarn admin employers search <industry>` - Search by industry

### Event Monitoring
- `yarn admin events jobs` - Job posting events
- `yarn admin events applications` - Application events
- `yarn admin events hires` - Hire events

### Data Export
- `yarn admin export jobs` - Export jobs
- `yarn admin export users` - Export users
- `yarn admin export employers` - Export employers
- `yarn admin export all` - Export everything

## 🛠️ Technical Details

### Dependencies Added

```json
{
  "@mysten/sui": "^1.11.0",
  "commander": "^12.0.0",
  "@types/node": "^20.0.0"
}
```

### Build Command

```bash
yarn build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Run Command

```bash
yarn admin <command>
```

This is equivalent to:

```bash
node dist/admin.js <command>
```

## 📝 Configuration File

The tool creates a `minihub.config.json` file in your working directory:

```json
{
  "network": "testnet",
  "packageId": "0x...",
  "jobBoardId": "0x...",
  "userRegistryId": "0x...",
  "employerRegistryId": "0x...",
  "clockId": "0x6"
}
```

## 🔧 Common Tasks

### Daily Monitoring

```bash
# Check platform health
yarn admin stats --detailed

# View recent activity
yarn admin events jobs --limit 20
yarn admin events applications --limit 20

# Monitor live
yarn admin monitor --interval 30
```

### Weekly Reports

```bash
# Export all data for analysis
yarn admin export all --dir reports/$(date +%Y-%m-%d)
```

### User Support

```bash
# Find user
yarn admin users view 0xUSER_PROFILE_ID

# Find job details
yarn admin jobs view 0xJOB_ID --show-applications
```

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild
rm -rf dist node_modules
yarn install
yarn build
```

### Configuration Issues

If config is not found:

```bash
# Check current directory
pwd

# Config file should be in: minihub.config.json
ls minihub.config.json

# Reinitialize if needed
yarn admin config init --network testnet ...
```

### Network Issues

If you get connection errors:

1. Check internet connection
2. Verify network setting (testnet/mainnet/devnet)
3. Try different network:
   ```bash
   yarn admin config update --network devnet
   ```

## 📚 Documentation

- **Full Guide**: `ADMIN_README.md`
- **Quick Start**: `ADMIN_QUICKSTART.md`
- **Examples**: `ADMIN_EXAMPLES.md`

## 🎯 Next Steps

1. **Deploy your contract** (if not done already)
   - Follow `deploy.md` instructions
   - Note the object IDs

2. **Initialize configuration**
   - Use object IDs from deployment
   - Choose correct network

3. **Test the tool**
   ```bash
   yarn admin stats
   yarn admin jobs list
   yarn admin users list
   ```

4. **Set up monitoring**
   ```bash
   yarn admin monitor
   ```

5. **Create automation scripts**
   - See `ADMIN_EXAMPLES.md` for script examples
   - Set up cron jobs for regular reports

## 💡 Pro Tips

1. **Use aliases** for frequently used commands:
   ```bash
   alias minihub-stats="yarn admin stats"
   alias minihub-jobs="yarn admin jobs list --active"
   alias minihub-monitor="yarn admin monitor --interval 30"
   ```

2. **Export regularly** for backup:
   ```bash
   # Add to crontab
   0 2 * * * cd /path/to/sdk && yarn admin export all --dir /backups/$(date +\%Y-\%m-\%d)
   ```

3. **Combine with jq** for advanced queries:
   ```bash
   yarn admin export jobs -o /tmp/jobs.json
   cat /tmp/jobs.json | jq '.[] | select(.isActive == true)'
   ```

4. **Pipe output** to files for logging:
   ```bash
   yarn admin stats > daily-stats.txt
   yarn admin jobs list > jobs-report.txt
   ```

## 🤝 Support

For issues or questions:

1. Check documentation files
2. Review examples in `ADMIN_EXAMPLES.md`
3. Run with `--help` flag for any command
4. Check GitHub issues (if applicable)

## ✅ Summary

You now have:

- ✅ Fully functional admin CLI tool
- ✅ Comprehensive documentation
- ✅ Usage examples and scripts
- ✅ Configuration management
- ✅ Real-time monitoring
- ✅ Data export capabilities
- ✅ Event tracking
- ✅ Search and filter functions

**Ready to manage your MiniHub platform! 🚀**

---

**Built with ❤️ for efficient MiniHub administration**
