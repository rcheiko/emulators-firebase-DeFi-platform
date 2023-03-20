import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();

export const schedule_user_monthly_performance = functions
  .region("europe-west1")
  .pubsub.schedule("0 12 1 * *")
  .timeZone("Europe/Paris")
  .onRun(async () => {
    const month: number = 60 * 60 * 24 * 30 * 1000;

    const userRef = db.collection("user");
    let allUser = await userRef.get();

    allUser.forEach(async (doc) => {
      let finalBalance = 0;
      let profit = 0; // profit of the month
      let pourcentage = 0; // pourcentage of profit of the month
      const userTrx = await db
        .collection("user")
        .doc(doc.id)
        .collection("transactions")
        .where("created", ">=", Date.now() - month)
        .orderBy("created", "asc")
        .get();

      userTrx.forEach((docc) => {
        finalBalance = finalBalance + docc.data().trx;
      });

      const result = await getBalanceLastMonth(doc);
      if (typeof(result) === 'number' && result > 0) finalBalance += result;

      const lastPortfolioDoc = await db
        .collection("user")
        .doc(doc.id)
        .collection("portfolio")
        .orderBy("created", "desc")
        .limit(1)
        .get();
      const balanceUser: number = lastPortfolioDoc.docs[0].data().balance;

      profit = balanceUser - finalBalance;
      pourcentage = profit / balanceUser;

      await db
        .collection("user")
        .doc(doc.id)
        .collection("monthlyPerformance")
        .doc()
        .set({
          balance: finalBalance + profit,
          profit: profit,
          pourcentage: pourcentage,
          created: Date.now(),
          month: new Date().getMonth(),
        });
    });
  });

export const manual_user_monthly_performance = functions
  .region("europe-west1")
  .https.onRequest(async (req, res) => {
    const month: number = 60 * 60 * 24 * 30 * 1000;

    const userRef = db.collection("user");
    let allUser = await userRef.get();

    allUser.forEach(async (doc) => {
      let finalBalance = 0;
      let profit = 0; // profit of the month
      let pourcentage = 0; // pourcentage of profit of the month
      const userTrx = await db
        .collection("user")
        .doc(doc.id)
        .collection("transactions")
        .where("created", ">=", Date.now() - month)
        .orderBy("created", "asc")
        .get();

      userTrx.forEach((docc) => {
        finalBalance = finalBalance + docc.data().trx;
      });

      const result = await getBalanceLastMonth(doc);
      if (result) finalBalance += result;

      const lastPortfolioDoc = await db
        .collection("user")
        .doc(doc.id)
        .collection("portfolio")
        .orderBy("created", "desc")
        .limit(1)
        .get();
      const balanceUser: number = lastPortfolioDoc.docs[0].data().balance;

      profit = balanceUser - finalBalance;
      pourcentage = profit / balanceUser;

      await db
        .collection("user")
        .doc(doc.id)
        .collection("monthlyPerformance")
        .doc()
        .set({
          balance: finalBalance + profit,
          profit: profit,
          pourcentage: pourcentage,
          created: Date.now(),
          month: new Date().getMonth(),
        });
    });
    res.send("All user monthly performance has been added");
  });

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
  monthly_perf.forEach(async (docc) => {
    res = docc.data().balance;
  });
  return res;
};

// Example : if it's january it will be 0 and minus 1 it will be 11
const calcPrevMonthsInNumber = (month: number) => {
  if (month === 0) return 11;
  if (month === 11) return 0;
  return month - 1;
};