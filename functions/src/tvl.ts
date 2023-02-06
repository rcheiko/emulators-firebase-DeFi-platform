import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ethers } from "ethers";
import * as lusdcTokenABI from "./abi/LUSDC.json";

const db = admin.firestore();

const providerLink =
  "wss://polygon-mainnet.g.alchemy.com/v2/oCpKb4y16gIydWUO7n2flcYSKAzkH3_p";
const lusdcTokenAddress = "0x1080fFf81F5DF23c024ce38D785a734Eb5f6d84d";
const lusdcDecimals = 18;

export const schedule_TVL = functions
  .region("europe-west1")
  .pubsub.schedule("0 */3 * * *")
  .timeZone("Europe/Paris")
  .onRun(async () => {
    const provider = new ethers.providers.WebSocketProvider(providerLink);
    const ltyToken = new ethers.Contract(
      lusdcTokenAddress,
      lusdcTokenABI.abi,
      provider
    );

    let tvl = await ltyToken.totalSupply();
    const ltyTvl = parseInt(tvl._hex, 16);

    await db
      .collection("tvl")
      .doc()
      .set({
        created: Date.now(),
        tvl: ltyTvl / 10 ** lusdcDecimals,
      });
  });

export const manual_tvl = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    const provider = new ethers.providers.WebSocketProvider(providerLink);
    const ltyToken = new ethers.Contract(
      lusdcTokenAddress,
      lusdcTokenABI.abi,
      provider
    );

    let tvl = await ltyToken.totalSupply();
    const ltyTvl = parseInt(tvl._hex, 16);

    await db
      .collection("tvl")
      .doc()
      .set({
        created: Date.now(),
        tvl: ltyTvl / 10 ** lusdcDecimals,
      });
    res.send("TVL has been added");
  });
