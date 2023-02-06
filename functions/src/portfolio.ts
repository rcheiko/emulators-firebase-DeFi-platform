import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ethers } from "ethers";
import * as lusdcTokenABI from "./abi/LUSDC.json";

const db = admin.firestore();

const providerLink =
  "wss://polygon-mainnet.g.alchemy.com/v2/oCpKb4y16gIydWUO7n2flcYSKAzkH3_p";
const lusdcTokenAddress = "0x1080fFf81F5DF23c024ce38D785a734Eb5f6d84d";
const lusdcDecimals = 18;

export const schedule_user_portfolio = functions
  .region("europe-west1")
  .pubsub.schedule("0 */4 * * *")
  .timeZone("Europe/Paris")
  .onRun(async () => {
    const provider = new ethers.providers.WebSocketProvider(providerLink);
    const ltyToken = new ethers.Contract(
      lusdcTokenAddress,
      lusdcTokenABI.abi,
      provider
    );

    let stats = {
      balance: 0,
      created: Date.now(),
    };

    const userRef = db.collection("user");
    let allUser = await userRef.get();

    allUser.forEach(async (doc) => {
      let result = await ltyToken.balanceOf(doc.id);
      stats.balance = parseInt(result._hex, 16) / 10 ** lusdcDecimals;
      await db
        .collection("user")
        .doc(doc.id)
        .collection("portfolio")
        .doc()
        .set(stats);
    });
  });

export const manual_user_portfolio = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    const provider = new ethers.providers.WebSocketProvider(providerLink);
    const ltyToken = new ethers.Contract(
      lusdcTokenAddress,
      lusdcTokenABI.abi,
      provider
    );

    let stats = {
      balance: 0,
      created: Date.now(),
    };

    const userRef = db.collection("user");
    let allUser = await userRef.get();

    allUser.forEach(async (doc) => {
      let result = await ltyToken.balanceOf(doc.id);
      stats.balance = parseInt(result._hex, 16) / 10 ** lusdcDecimals;
      await db
        .collection("user")
        .doc(doc.id)
        .collection("portfolio")
        .doc()
        .set(stats);
    });
    res.send("All user portfolio has been added");
  });
