import React from "react";
import { ethers } from "ethers";
import AuctionArtifact from "./artifacts/Auction.json";
import AuctionManagerArtifact from "./artifacts/AuctionManager.json";
import NFTArtifact from "./artifacts/ButterflyToken.json";
const NFT_ADDRESS = "Add_NFT_Address_Here"; // NFT contract address
const AUCTIONMANAGER_ADDRESS = "Add_auction_Manager_address here"; // AuctionManager contract address
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
      this.setState({ currentAddress: await this.signer.getAddress() }); // Set the current address
      // Add the Step 3 Code here for the auction manager contract object

      // Add the Step 3 code here for the NFT contract object

      this.getItems();
      this.getAuctions();
    } else {
      alert("No wallet detected");
    }
  }
  async getItems() {
    // Paste Step 4 code here
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
    // Paste step 5 code here
  }
  async getAuctions() {
    // Insert Step 6 code here
  }
  async setActiveAuction(auction, _this) {
    // Add the Step 3 code here for the auction contract object
    //
    // Add step 7 code here
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
    let highestBidder = "";
    activeAuction.bids.forEach((bid) => {
      if (bid.bid === activeAuction.highestBid) {
        highestBidder = bid.bidder;
      }
    });
    const isHighestBidder = highestBidder === this.state.currentAddress;
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
                Place Bid
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
    // Add Step 8 code here
    this.setActiveAuction(this.state.activeAuction, this);
  }

  async withdrawToken() {
    // Add Step 9 code heeere
    window.location.reload(); // Reload the page
  }

  async withdrawFunds() {
    // Add Step 10 code here
    window.location.reload(); // Reload the page
  }

  async cancelAuction() {
    //  Add Step 11 code here
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
