# Đề Xuất Tính Năng Onchain cho Flappy Mini

## 📊 Tổng Quan

Hiện tại game Flappy Bird chưa có tính năng onchain nào. Dưới đây là các đề xuất tính năng onchain để tăng giá trị và trải nghiệm người dùng trên Base App.

## 🎯 Tính Năng Đề Xuất (Theo Độ Ưu Tiên)

### 🔴 Priority 1: Core Onchain Features (Nên làm trước)

#### 1. **Onchain Leaderboard** 
- **Mục đích**: Lưu điểm số cao lên blockchain, tạo tính cạnh tranh thật
- **Lợi ích**: 
  - Người dùng có thể chứng minh điểm số của mình
  - Leaderboard công khai, minh bạch
  - Không thể fake được điểm số
- **Implementation**:
  - Smart Contract lưu mapping `address => score`
  - Gọi contract khi đạt điểm cao hơn best score
  - Hiển thị top 10 leaderboard onchain

#### 2. **Achievement NFTs**
- **Mục đích**: Mint NFT khi đạt điểm cao (milestone achievements)
- **Lợi ích**:
  - Người dùng có NFT làm kỷ niệm
  - Có thể trade, collect NFTs
  - Tăng engagement và viral sharing
- **Implementation**:
  - NFT Contract (ERC-721)
  - Mint tự động khi đạt 10, 20, 30, 40+ điểm
  - Mỗi milestone = 1 NFT unique
  - Onchain metadata với điểm số và timestamp

#### 3. **Smart Wallet + Paymaster Integration**
- **Mục đích**: Gasless transactions cho người dùng
- **Lợi ích**:
  - Người dùng không cần ETH để giao dịch
  - UX mượt mà hơn (sponsored gas)
  - Tận dụng Base Account capabilities
- **Implementation**:
  - Tích hợp MiniKit với Smart Wallet
  - Configure Paymaster từ Coinbase Developer Platform
  - Sponsor gas cho leaderboard và NFT mints

### 🟡 Priority 2: Social & Engagement (Làm sau)

#### 4. **Social Sharing (Farcaster Integration)**
- **Mục đích**: Chia sẻ điểm số lên Farcaster feed
- **Lợi ích**:
  - Viral marketing tự nhiên
  - Challenge friends
  - Tăng discovery cho Mini App
- **Implementation**:
  - Sử dụng `useComposeCast` hook từ MiniKit
  - Format message với điểm số và link
  - Optional: Embed game screenshot

#### 5. **Challenge Friends**
- **Mục đích**: Gửi challenge cho bạn bè trên Farcaster
- **Lợi ích**:
  - Tăng social interaction
  - Tạo cộng đồng xung quanh game
- **Implementation**:
  - Sử dụng Farcaster context để lấy friends list
  - Gửi cast mention đến bạn bè
  - Track challenge results

### 🟢 Priority 3: Advanced Features (Tùy chọn)

#### 6. **Reward Tokens**
- **Mục đích**: Airdrop token khi đạt điểm cao
- **Implementation**: ERC-20 token rewards (phức tạp hơn, cần tokenomics)

#### 7. **Onchain High Score Auction**
- **Mục đích**: Auction NFT của high score
- **Implementation**: Smart contract auction system

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)
1. ✅ Tích hợp MiniKit và Smart Wallet
2. ✅ Setup Paymaster (Coinbase Developer Platform)
3. ✅ Tạo Smart Contracts (Leaderboard + NFT)
4. ✅ Deploy contracts lên Base

### Phase 2: Integration (Week 1-2)
1. ✅ Tích hợp leaderboard vào game UI
2. ✅ Thêm UI mint NFT khi đạt milestone
3. ✅ Test gasless transactions

### Phase 3: Social (Week 2-3)
1. ⏳ Thêm social sharing
2. ⏳ Challenge friends feature
3. ⏳ Analytics và tracking

## 📝 Smart Contract Structure

### FlappyLeaderboard.sol
```solidity
- submitScore(uint256 score)
- getScore(address player) returns (uint256)
- getTopPlayers(uint256 limit) returns (address[], uint256[])
```

### FlappyAchievementNFT.sol
```solidity
- mintAchievement(address to, uint256 milestone)
- getAchievements(address player) returns (uint256[])
```

## 💰 Cost Estimation

- **Contract Deployment**: ~$5-10 (Base gas fees)
- **Paymaster**: Free up to $15k/month (Coinbase sponsorship)
- **Per Transaction**: 
  - Submit score: ~$0.01-0.02 (sponsored)
  - Mint NFT: ~$0.02-0.05 (sponsored)

## 🎨 UI/UX Changes Needed

1. **Leaderboard Tab**: Hiển thị top players
2. **Achievement Badge**: Hiển thị NFTs đã mint
3. **Mint Button**: Appear khi đạt milestone
4. **Share Button**: Chia sẻ điểm số
5. **Wallet Status**: Hiển thị wallet address

## 📚 Resources

- [Base Paymaster Guide](https://docs.base.org/cookbook/go-gasless)
- [MiniKit Documentation](https://docs.base.org/mini-apps/introduction/overview)
- [Simple Onchain NFTs](https://docs.base.org/learn/token-development/nft-guides/simple-onchain-nfts)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com)

## 🤔 Questions to Decide

1. **NFT Minting**: 
   - Free cho tất cả milestone?
   - Hay chỉ milestone cao (30+)?
   
2. **Leaderboard**:
   - Unlimited entries?
   - Hay chỉ top 100/1000?
   
3. **Gas Sponsorship**:
   - Sponsor tất cả transactions?
   - Hay chỉ NFT mints?

## ✅ Next Steps

1. Review và chọn tính năng muốn implement
2. Tạo smart contracts
3. Integrate vào game
4. Test trên Base Sepolia
5. Deploy lên Base Mainnet

