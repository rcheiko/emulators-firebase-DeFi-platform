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


export const manual_user_portfolio = functions.https.onRequest(
    async (req, res) => {
      const provider = new ethers.providers.WebSocketProvider(providerLink);
      const ltyToken = new ethers.Contract(
        ltyTokenAddress,
        ltyTokenABI.abi,
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
        stats.balance = parseInt(result._hex, 16) / 10 ** ltyDecimals;
        await db
          .collection("user")
          .doc(doc.id)
          .collection("portfolio")
          .doc()
          .set(stats);
      });
      res.send("All user portfolio has been added");
    }
  );
  
  export const schedule_user_portfolio = functions.pubsub
    .schedule("every 4 hour")
    .onRun(async () => {
      const provider = new ethers.providers.WebSocketProvider(providerLink);
      const ltyToken = new ethers.Contract(
        ltyTokenAddress,
        ltyTokenABI.abi,
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
        stats.balance = parseInt(result._hex, 16) / 10 ** ltyDecimals;
        await db
          .collection("user")
          .doc(doc.id)
          .collection("portfolio")
          .doc()
          .set(stats);
      });
    });
  