import cron from "node-cron";
import { batchProcessOpenApi } from "../jobs";
import Container from "typedi";
import Bull from "bull";

export default async function schedulerLoader() {
    const processQueue: Bull.Queue = Container.get("processQueue");
    cron.schedule(
        "10 18 * * *",
        async () => {
            console.log("Running batch process for judicial precedents...");
            try {
                await processQueue.add("process", {});
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
    processQueue.process("process", async (job) => {
        try {
            console.log("Running batch process for judicial precedents...");
            await batchProcessOpenApi();
            console.log("Batch process completed successfully.");
        } catch (error) {
            console.error("Batch process encountered an error:", error);
        }
    });
}
