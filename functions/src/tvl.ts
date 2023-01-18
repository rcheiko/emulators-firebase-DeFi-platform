import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ethers } from "ethers";
import * as ltyTokenABI from "./abi/LDG01.json";

admin.initializeApp();
const db = admin.firestore();

const providerLink =
  "wss://polygon-mumbai.g.alchemy.com/v2/jjJR-dEK1trjqGpQCsNyQ-sq4ofD2nS8";
const ltyTokenAddress = "0x9b7F3Cb11b6E448a84584B796629F8e3f0216538";
const ltyDecimals = 18;

export const schedule_TVL = functions.pubsub
  .schedule("every 3 hour")
  .onRun(async () => {
    const provider = new ethers.providers.WebSocketProvider(providerLink);
    const ltyToken = new ethers.Contract(
      ltyTokenAddress,
      ltyTokenABI.abi,
      provider
    );

    let tvl = await ltyToken.totalSupply();
    const ltyTvl = parseInt(tvl._hex, 16);

    await db
      .collection("tvl")
      .doc()
      .set({
        created: Date.now(),
        tvl: ltyTvl / 10 ** ltyDecimals,
      });
  });

export const manual_tvl = functions.https.onRequest(async (req, res) => {
  const provider = new ethers.providers.WebSocketProvider(providerLink);
  const ltyToken = new ethers.Contract(
    ltyTokenAddress,
    ltyTokenABI.abi,
    provider
  );

  let tvl = await ltyToken.totalSupply();
  const ltyTvl = parseInt(tvl._hex, 16);

  await db
    .collection("tvl")
    .doc()
    .set({
      created: Date.now(),
      tvl: ltyTvl / 10 ** ltyDecimals,
    });
  res.send("TVL has been added");
});