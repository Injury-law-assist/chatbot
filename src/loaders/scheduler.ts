import cron from "node-cron";
import { batchProcessOpenApi } from "../jobs";

export default async function schedulerLoader() {
    cron.schedule(
        "0 0 1 * *",
        async () => {
            console.log("Running batch process for judicial precedents...");
            try {
                await batchProcessOpenApi();
                console.log("Batch process completed successfully.");
            } catch (error) {
                console.error("Batch process encountered an error:", error);
            }
        },
        {
            scheduled: true,
            timezone: "Asia/Seoul",
        }
    );
}
