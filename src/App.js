import React from "react";
import { ethers } from "ethers";
import AuctionArtifact from "./artifacts/Auction.json";
import AuctionManagerArtifact from "./artifacts/AuctionManager.json";
import NFTArtifact from "./artifacts/ButterflyToken.json";
const NFT_ADDRESS = "0x8f5577ee1078376714bd73c3e2b6fa18a877fce9"; // NFT contract address
const AUCTIONMANAGER_ADDRESS = "0x2fe89bc41Db8A357dE7757F4D2D9E185ad2c58F1"; // AuctionManager contract address
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auctions: [], // Auctions to display
      newAuction: {
        // newAuction is a state variable for the form
        startPrice: null,
        endTime: null,
        tokenId: null,
        minIncrement: null,
        directBuyPrice: null,
      },
      myItems: [],
    };
  }
  async init() {
    if (window.ethereum) {
      await window.ethereum.enable(); // Enable the Ethereum client
      this.provider = new ethers.providers.Web3Provider(window.ethereum); // A connection to the Ethereum network
      this.signer = this.provider.getSigner(); // Holds your private key and can sign things
      this.setState({ currentAddress: this.signer.getAddress() }); // Set the current address
      // Add the Step 2 Code here for the auction manager contract object
      this._auctionManager = new ethers.Contract(
        AUCTIONMANAGER_ADDRESS,

        AuctionManagerArtifact.abi,

        this.signer
      );
      // Add the Step 2 code here for the NFT contract object
      this._nft = new ethers.Contract(
        NFT_ADDRESS,

        NFTArtifact.abi,

        this.signer
      );
      this.getItems();
      this.getAuctions();
    } else {
      alert("No wallet detected");
    }
  }
  async getItems() {
    const walletAddress = await this.signer.getAddress();
    let tokenOwner = null;
    let counter = 0;
    const NFTIds = [];
    do {
      try {
        tokenOwner = await this._nft.ownerOf(counter);
        if (tokenOwner === walletAddress) {
          NFTIds.push(counter);
        }
        counter++;
      } catch (error) {
        tokenOwner = null;
      }
    } while (tokenOwner != null);
    this.setState({ myItems: NFTIds });
  }
  async createAuction() {
    if (
      !this.state.newAuction.minIncrement ||
      !this.state.newAuction.directBuyPrice ||
      !this.state.newAuction.startPrice ||
      !this.state.newAuction.endTime ||
      !this.state.newAuction.tokenId
    ) {
      console.log(this.state.newAuction);
      return alert("Fill all the fields");
    }

    let { hash: allowance_hash } = await this._nft.approve(
      AUCTIONMANAGER_ADDRESS,
      this.state.newAuction.tokenId
    ); // Approve the AUCTIONMANAGER to transfer the token
    console.log("Approve Transaction sent! Hash:", allowance_hash);
    await this.provider.waitForTransaction(allowance_hash); // Wait till the transaction is mined
    console.log("Transaction mined!");

    let { hash } = await this._auctionManager.createAuction(
      // Create an auction
      this.state.newAuction.endTime * 60, // Converting minutes to seconds
      ethers.utils.parseEther(this.state.newAuction.minIncrement.toString()), // Minimum increment in AVAX
      ethers.utils.parseEther(this.state.newAuction.directBuyPrice.toString()), // Direct buy price in AVAX
      ethers.utils.parseEther(this.state.newAuction.startPrice.toString()), // Start price in AVAX
      NFT_ADDRESS, // The address of the NFT token
      this.state.newAuction.tokenId // The id of the token
    );
    console.log("Transaction sent! Hash:", hash);
    await this.provider.waitForTransaction(hash); // Wait till the transaction is mined
    console.log("Transaction mined!");
    alert(`Transaction sent! Hash: ${hash}`);
  }
  async getAuctions() {
    let auctionsAddresses = await this._auctionManager.getAuctions(); // get a list of auction addresses
    let auctions = await this._auctionManager.getAuctionInfo(auctionsAddresses); // I'll just pass all the addresses here, you can build a pagination system if you want

    let new_auctions = [];

    for (let i = 0; i < auctions.endTime.length; i++) {
      let endTime = auctions.endTime[i].toNumber();
      let tokenId = auctions.tokenIds[i].toNumber();
      let auctionState = auctions.auctionState[i].toNumber();

      let startPrice = ethers.utils.formatEther(auctions.startPrice[i]);
      let directBuyPrice = ethers.utils.formatEther(auctions.directBuy[i]);
      let highestBid = ethers.utils.formatEther(auctions.highestBid[i]);

      let owner = auctions.owner[i];

      let newAuction = {
        endTime: endTime,
        startPrice: startPrice,
        owner: owner,
        directBuyPrice: directBuyPrice,
        tokenId: tokenId,
        highestBid: highestBid,
        auctionState: auctionState,
        auctionAddress: auctionsAddresses[i],
      };
      new_auctions.push(newAuction);
    }

    this.setState({ auctions: new_auctions }); // Update the state
  }
  async setActiveAuction(auction, _this) {
    // Add the Step 2 code here for the auction contract object
    _this._auction = new ethers.Contract(
      auction.auctionAddress,
      AuctionArtifact.abi,
      _this.signer
    );
    let previousBids = await _this._auction.allBids(); // Get the bids
    let bids = []; // A list of bids
    for (let i = 0; i < previousBids[0].length; i++) {
      // Loop through the bids
      bids.push({
        // Add the bid to the list
        bidder: previousBids[0][i], // The bidder
        bid: ethers.utils.formatEther(previousBids[1][i]), // The bid
      });
    }

    auction.bids = bids; // Add the bids array to the auction object

    // let auctionTokenValue = await _this._nft.tokenURI(auction.tokenId); // Get the value of the token
    // auction.auctionTokenValue = auctionTokenValue; // Add the value of the token to the auction object

    let highestBidder = await _this._auction.maxBidder(); // Get the highest bidder
    auction.highestBidder = highestBidder; // Add the highest bidder to the auction object

    let minIncrement = await _this._auction.minIncrement(); // Get the minimum increment
    auction.minIncrement = ethers.utils.formatEther(minIncrement); // Add the minimum increment to the auction object

    _this.setState({ activeAuction: auction }); // Update the state
  }
  renderAuctionElement(auction, _this) {
    let state = "";
    if (auction.auctionState === 0) {
      state = "Open";
    }
    if (auction.auctionState === 1) {
      state = "Cancelled";
    }
    if (auction.auctionState === 2) {
      state = "Ended";
    }
    if (auction.auctionState === 3) {
      state = "Direct Buy";
    }
    return (
      <div style={{ background: "yellow" }} class="col">
        <p>ID: {auction.tokenId}</p> {/* ID of the token */}
        <p>Highest Bid: {auction.highestBid || 0}</p>
        {/* Highest bid */}
        <p>Direct Buy: {auction.directBuyPrice}</p> {/* Direct buy price */}
        <p>Starting Price: {auction.startPrice}</p> {/* Starting price */}
        <p>Owner: {auction.owner}</p> {/* Owner of the token */}
        <p>
          End Time:{" "}
          {Math.round((auction.endTime * 1000 - Date.now()) / 1000 / 60)}{" "}
          {/* Time left in minutes */}
          minutes
        </p>
        <p>Auction State: {state}</p>
        <button
          class="btn-primary"
          onClick={() => {
            _this.setActiveAuction(auction, _this);
          }}
        >
          See More
        </button>
      </div>
    );
  }

  renderActiveAuction() {
    let activeAuction = this.state.activeAuction;

    let state = "";
    if (activeAuction.auctionState === 0) {
      // If the auction is open
      state = "Open";
    }
    if (activeAuction.auctionState === 1) {
      // If the auction is cancelled
      state = "Cancelled";
    }
    if (activeAuction.auctionState === 2) {
      // If the auction is ended
      state = "Ended";
    }
    if (activeAuction.auctionState === 3) {
      // If the auction is ended by a direct buy
      state = "Direct Buy";
    }
    let isOwner = this.state.currentAddress === activeAuction.owner; // Check if the current address is the owner
    let isAuctionOpen = state === "Open"; // Check if the auction is open
    // let isAuctionCancelled = state === "Cancelled"; // Check if the auction is cancelled
    const isHighestBidder =
      activeAuction.bids.length !== 0 &&
      this.state.currentAddress ===
        activeAuction.bids.filter(
          (bid) => bid.bid === activeAuction.highestBid
        )[0].bidder;
    let isAuctionEnded = state === "Ended" || state === "Direct Buy"; // Check if the auction is ended
    return (
      <div>
        <div class="col">
          <button
            class="btn-secondary"
            onClick={() => this.setState({ activeAuction: null })}
          >
            Go Back
          </button>
          <p>ID: {activeAuction.tokenId}</p> {/* ID of the token */}
          <p>Highest Bid: {activeAuction.highestBid || 0} AVAX</p>
          {/* Highest bid */}
          <p>Direct Buy: {activeAuction.directBuyPrice} AVAX</p>{" "}
          {/* Direct buy price */}
          <p>Minimum Increment: {activeAuction.minIncrement} AVAX</p>{" "}
          {/* Minimum increment in AVAX */}
          <p>Starting Price: {activeAuction.startPrice} AVAX</p>{" "}
          {/* Starting price */}
          <p>Owner: {activeAuction.owner}</p> {/* Owner of the token */}
          <p>
            End Time:{" "}
            {Math.round(
              (activeAuction.endTime * 1000 - Date.now()) / 1000 / 60
            )}{" "}
            {/* Time left in minutes */}
            minutes
          </p>
          <p>Auction State: {state}</p>
        </div>
        <div class="col">
          <h3>Bids</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Bid</th>
              </tr>
            </thead>
            <tbody>
              {activeAuction.bids.map((bid) => {
                return (
                  <tr key={bid.bidder}>
                    <td>{bid.bidder}</td>
                    <td>{bid.bid} AVAX</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div class="col">
          {isAuctionOpen && !isOwner ? (
            <div>
              <input
                type="number"
                placeholder="0.5"
                onChange={(e) => this.setState({ bidAmount: e.target.value })}
              />
              <button
                class="btn-primary"
                onClick={() => this.placeBid(this.state.bidAmount)}
              >
                Place Pid
              </button>
            </div>
          ) : null}
          {isOwner && isAuctionOpen && activeAuction.bids.length === 0 ? (
            <button class="btn-danger" onClick={() => this.cancelAuction()}>
              Cancel Auction
            </button>
          ) : null}
          {isOwner && isAuctionEnded && activeAuction.bids.length > 0 ? (
            <button class="btn-secondary" onClick={() => this.withdrawFunds()}>
              Withdraw Funds
            </button>
          ) : null}
          {((activeAuction.bids.length === 0 && isOwner) || isHighestBidder) &&
          isAuctionEnded ? (
            <button class="btn-secondary" onClick={() => this.withdrawToken()}>
              Withdraw Token
            </button>
          ) : null}
        </div>
      </div>
    );
  }
  async placeBid(amount) {
    if (!amount) return;
    amount = ethers.utils.parseEther(amount.toString()); // Amount in AVAX
    let { hash } = await this._auction.placeBid({ value: amount }); // Place a bid
    await this.provider.waitForTransaction(hash); // Wait till the transaction is mined
    alert(`Transaction sent! Hash: ${hash}`); // Show the transaction hash
    this.setActiveAuction(this.state.activeAuction, this); // Update the active auction
  }

  async withdrawToken() {
    let { hash } = await this._auction.withdrawToken(); // Withdraw the NFT token
    await this.provider.waitForTransaction(hash); // Wait till the transaction is mined
    alert(`Withdrawal Successful! Hash: ${hash}`); // Show the transaction hash
    window.location.reload(); // Reload the page
  }

  async withdrawFunds() {
    let { hash } = await this._auction.withdrawFunds(); // Withdraw the funds
    await this.provider.waitForTransaction(hash); // Wait till the transaction is mined
    alert(`Withdrawal Successful! Hash: ${hash}`); // Show the transaction hash
    window.location.reload(); // Reload the page
  }

  async cancelAuction() {
    let { hash } = await this._auction.cancelAuction(); // Cancel the auction
    await this.provider.waitForTransaction(hash); // Wait till the transaction is mined
    alert(`Auction Canceled! Hash: ${hash}`); // Show the transaction hash
    window.location.reload(); // Reload the page
  }

  componentDidMount() {
    this.init();
  }
  render() {
    return (
      <div>
        <div class="jumbotron d-flex align-items-center">
          <div class="container">
            {this.state.activeAuction != null ? (
              this.renderActiveAuction()
            ) : (
              <div class="auctions row">
                {this.state.auctions.map((auction) =>
                  this.renderAuctionElement(auction, this)
                )}
              </div>
            )}
          </div>
        </div>
        <div class="container">
          <form>
            <div class="mb-3">
              <label for="startprice" class="form-label">
                Start Price
              </label>
              <input
                value={this.state.newAuction.startPrice}
                onChange={(e) =>
                  this.setState({
                    newAuction: {
                      ...this.state.newAuction,
                      startPrice: parseFloat(e.target.value),
                    },
                  })
                }
                type="number"
                class="form-control"
                id="startprice"
              />
              <label for="startprice" class="form-label">
                Token Id
              </label>
              <input
                value={this.state.newAuction.tokenId}
                onChange={(e) =>
                  this.setState({
                    newAuction: {
                      ...this.state.newAuction,
                      tokenId: parseInt(e.target.value),
                    },
                  })
                }
                type="number"
                class="form-control"
                id="startprice"
              />
              <label class="form-label">Minimum Increment</label>
              <input
                value={this.state.newAuction.minIncrement}
                onChange={(e) =>
                  this.setState({
                    newAuction: {
                      ...this.state.newAuction,
                      minIncrement: parseFloat(e.target.value),
                    },
                  })
                }
                type="number"
                class="form-control"
              />
              <label class="form-label">Direct Buy Price</label>
              <input
                value={this.state.newAuction.directBuyPrice}
                onChange={(e) =>
                  this.setState({
                    newAuction: {
                      ...this.state.newAuction,
                      directBuyPrice: parseFloat(e.target.value),
                    },
                  })
                }
                type="number"
                class="form-control"
              />

              <label class="form-label">Duration In Minutes</label>
              <input
                value={this.state.newAuction.endTime}
                onChange={(e) =>
                  this.setState({
                    newAuction: {
                      ...this.state.newAuction,
                      endTime: parseInt(e.target.value),
                    },
                  })
                }
                type="number"
                class="form-control"
              />
            </div>

            <button
              type="button"
              onClick={() => this.createAuction()}
              class="btn btn-primary"
            >
              Create Auction
            </button>
          </form>
          {/* <button class="btn btn-fanger">Mint NFT</button> */}
          <p>
            Your items
            <br />
            {(this.state.myItems || [""]).map((x) => `id: ${x} `) || ""}
          </p>
        </div>
      </div>
    );
  }
}
export default App;
