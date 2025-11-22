# MiniHub - Sui Job Board Frontend

A decentralized job board application built on the Sui blockchain. MiniHub connects employers with candidates through smart contracts, enabling transparent and trustless job postings and applications.

## 🚀 Features

- 🔐 **Dual Authentication**
  - **Sui Wallet Integration** - Connect with any Sui-compatible wallet
  - **zkLogin** - Sign in with Google (no wallet needed!)
- 💼 **Job Listings** - Browse and filter blockchain jobs directly from Sui blockchain
- 🔍 **Search & Filter** - Real-time search by title, employer, or description
- 📝 **On-Chain Applications** - Submit applications directly to smart contracts
- 🎨 **Modern UI** - Navy blue and orange themed responsive design
- ⚡ **Fast & Reactive** - Built with React 18, TypeScript, and Vite
- 🔗 **Blockchain SDK** - Direct integration with Sui smart contracts

## 🎨 Design Theme

**Colors:**
- **Navy Blue**: `#001F3F`, `#003D73`, `#0056A6`
- **Orange**: `#FF6B35`, `#FF8C5A`
- Dark backgrounds with glassmorphism effects

## 📋 Prerequisites

- Node.js 18+ and npm
- Sui Wallet browser extension
- Backend API server (see [BACKEND_API.md](./BACKEND_API.md))

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUI_NETWORK=testnet

# Smart Contract Configuration (required)
VITE_JOB_BOARD_PACKAGE_ID=0x...
VITE_JOB_BOARD_OBJECT_ID=0x...
VITE_USER_REGISTRY_ID=0x...
VITE_EMPLOYER_REGISTRY_ID=0x...

# zkLogin OAuth (optional, for social login)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_REDIRECT_URL=http://localhost:5173
```

> **Note:** For zkLogin setup instructions, see [ZKLOGIN_GUIDE.md](./ZKLOGIN_GUIDE.md)

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
npm run preview  # Preview production build
```

## 📁 Project Structure

```
src/
├── App.tsx              # Main app component
├── App.css              # Styling with navy/orange theme
├── sdk/
│   └── minihub-sdk.ts   # Sui blockchain SDK
├── types/
│   └── index.ts         # TypeScript interfaces matching smart contracts
├── services/
│   └── api.ts           # Backend API service
├── hooks/
│   ├── useZkLogin.ts    # zkLogin authentication hook
│   └── useMiniHub.ts    # React hooks for blockchain data
├── components/
│   ├── ZkLoginButton.tsx    # zkLogin UI components
│   └── ZkLoginButton.css    # zkLogin styles
├── vite-env.d.ts        # Vite environment types
└── main.tsx             # App entry point
```

## 🔗 Smart Contract Integration

### On-Chain Data Structures

The frontend integrates with these Sui Move smart contract structures:

```move
// JobBoard - Main board
public struct JobBoard has key {
    id: UID,
    job_count: u64,
    job_ids: vector<ID>,
}

// Job - Job posting
public struct Job has key, store {
    id: UID,
    employer: address,
    title: String,
    description: String,
    salary: Option<u64>,
    application_count: u64,
    hired_candidate: Option<address>,
    is_active: bool,
    deadline: u64,
}

// ApplicationProfile - Candidate application
public struct ApplicationProfile has key, store {
    id: UID,
    candidate: address,
    job_id: ID,
    cover_message: String,
    timestamp: u64,
    cv_url: String,
}
```

See [BACKEND_API.md](./BACKEND_API.md) for complete API documentation.

## 🎯 Key Components

### JobListings Component
- Displays all active job postings
- Real-time filtering and search
- Shows application count and deadlines
- Wallet-gated apply button

### Filters
- **Search**: Full-text search across title, company, description
- **Category**: Engineering, Design, Product, etc.
- **Type**: Full-time, Part-time, Contract, Freelance
- **Location**: City/country filtering with remote option

## 🔐 Authentication

### Crypto Wallet (Traditional)
Compatible with all Sui Wallet Standard wallets:
- Sui Wallet
- Suiet Wallet
- Ethos Wallet
- Martian Wallet
- And more...

### zkLogin (Social Login) 🆕
Users can sign in without a crypto wallet using:
- **Google** - Sign in with Google account
- **Facebook** - Sign in with Facebook account  
- **Twitch** - Sign in with Twitch account

zkLogin uses zero-knowledge proofs to derive a Sui address from OAuth credentials.

**Setup:** See [ZKLOGIN_GUIDE.md](./ZKLOGIN_GUIDE.md) for detailed setup instructions.

## 📡 API Integration

The app uses a backend API to:
1. Fetch on-chain job data from Sui blockchain
2. Enrich with off-chain metadata (company info, logos, etc.)
3. Handle authentication via wallet signatures
4. Submit applications as blockchain transactions

See `src/services/api.ts` for the API client implementation.

## 🚧 Current Status

**Implemented:**
- ✅ Wallet connection with Sui dApp Kit
- ✅ zkLogin social authentication (Google, Facebook, Twitch)
- ✅ Job listings UI with filters
- ✅ TypeScript interfaces matching smart contracts
- ✅ API service layer
- ✅ Responsive design with navy/orange theme
- ✅ Dual authentication modal

**Next Steps:**
- 🔄 Backend API integration (mock data currently)
- 🔄 Job application modal
- 🔄 User profile/dashboard
- 🔄 Employer job posting interface

## 📚 Documentation

- [Backend API Specification](./BACKEND_API.md)
- [zkLogin Setup Guide](./ZKLOGIN_GUIDE.md)
- [Smart Contract Types](./src/types/index.ts)

## 🛡️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **@mysten/dapp-kit** - Sui wallet integration
- **@mysten/sui.js** - Sui blockchain SDK
- **@tanstack/react-query** - Data fetching

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For questions or issues:
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ on Sui Network
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Configuration

The app connects to Sui **testnet** by default. To change the network, modify the `defaultNetwork` prop in `App.tsx`:

```tsx
<SuiClientProvider networks={networks} defaultNetwork="mainnet">
```

## Technologies

- [@mysten/dapp-kit](https://sui-typescript-docs.vercel.app/dapp-kit) - Sui wallet adapter
- [@mysten/sui.js](https://sui-typescript-docs.vercel.app/typescript) - Sui TypeScript SDK
- [@tanstack/react-query](https://tanstack.com/query) - Data fetching and state management
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool
