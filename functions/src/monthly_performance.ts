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

export const schedule_user_monthly_performance = functions.pubsub
  .schedule("0 12 1 * *")
  .onRun(async () => {
    const provider = new ethers.providers.WebSocketProvider(providerLink);
    const ltyToken = new ethers.Contract(
      ltyTokenAddress,
      ltyTokenABI.abi,
      provider
    );

    const month: number = 60 * 60 * 24 * 30 * 1000;

    const userRef = db.collection("user");
    let allUser = await userRef.get();

    let finalBalance = 0;
    let address = ""; // address of user
    let balanceTrx; // balance of all the transaction of the month
    let balParsed = 0;
    let profit = 0; // profit of the month
    let pourcentage = 0; // pourcentage of profit of the month

    allUser.forEach(async (doc) => {
      address = doc.id;
      const user = await db
        .collection("user")
        .doc(doc.id)
        .collection("transactions")
        .where("created", ">=", Date.now() - month)
        .orderBy("created", "asc")
        .get();

      user.forEach(async (doc) => {
        finalBalance += doc.data().trx;
      });

      const result = await getBalanceLastMonth(doc);
      if (result) finalBalance += result;

      balanceTrx = await ltyToken.balanceOf(address);

      balParsed = parseInt(balanceTrx._hex, 16) / 10 ** ltyDecimals;

      profit = balParsed - finalBalance;
      pourcentage = profit / balParsed;

      await db
        .collection("user")
        .doc(doc.id)
        .collection("monthlyPerformance")
        .doc()
        .set({
          balance: balParsed,
          profit: profit,
          pourcentage: pourcentage,
          created: Date.now(),
          month: new Date().getMonth(),
        });
      finalBalance = 0;
    });
  });

// export const manual_user_monthly_performance = functions.https.onRequest(
//   async (req, res) => {
//     const provider = new ethers.providers.WebSocketProvider(providerLink);
//     const ltyToken = new ethers.Contract(
//       ltyTokenAddress,
//       ltyTokenABI.abi,
//       provider
//     );

//     const month: number = 60 * 60 * 24 * 30 * 1000;

//     const userRef = db.collection("user");
//     let allUser = await userRef.get();

//     let finalBalance = 0;
//     let address = ""; // address of user
//     let balanceTrx; // balance of all the transaction of the month
//     let balParsed = 0;
//     let profit = 0; // profit of the month
//     let pourcentage = 0; // pourcentage of profit of the month

//     allUser.forEach(async (doc) => {
//       address = doc.id;
//       const user = await db
//         .collection("user")
//         .doc(doc.id)
//         .collection("transactions")
//         .where("created", ">=", Date.now() - month)
//         .orderBy("created", "asc")
//         .get();

//       user.forEach(async (doc) => {
//         finalBalance += doc.data().trx;
//       });

//       const result = await getBalanceLastMonth(doc);
//       if (result) finalBalance += result;

//       balanceTrx = await ltyToken.balanceOf(address);

//       balParsed = parseInt(balanceTrx._hex, 16) / 10 ** ltyDecimals;

//       profit = balParsed - finalBalance;
//       pourcentage = profit / balParsed;

//       await db
//         .collection("user")
//         .doc(doc.id)
//         .collection("monthlyPerformance")
//         .doc()
//         .set({
//           balance: balParsed,
//           profit: profit,
//           pourcentage: pourcentage,
//           created: Date.now(),
//           month: new Date().getMonth(),
//         });
//       finalBalance = 0;
//     });
//     res.send("All user monthly performance has been added");
//   }
// );

// Example : if it's january it will be 0 and minus 1 it will be 11
const calcPrevMonthsInNumber = (month: number) => {
  if (month === 0) return 11;
  if (month === 11) return 0;
  return month - 1;
};

// Get portfolio balance of the last months
const getBalanceLastMonth = async (
  doc: admin.firestore.QueryDocumentSnapshot<admin.firestore.DocumentData>
) => {
  const monthly_perf = await db
    .collection("user")
    .doc(doc.id)
    .collection("monthlyPerformance")
    .where("month", "==", calcPrevMonthsInNumber(new Date().getMonth()))
    .get();
  let res;
  monthly_perf.forEach(async (doc) => {
    res = doc.data().balance;
  });
  return res;
};
