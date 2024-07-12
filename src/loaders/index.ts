import { Application } from "express";
import expressLoader from "./express";
import bullQueueLoader from "./bull-queue";
import schedulerLoader from "./scheduler";
import OpenAILoader from "./openai";
import dependencyInjectionLoader from "./dependency-injection";
import mysqlLoader from "./mysql";

export default async ({ app }: { app: Application }) => {
    const pool = await mysqlLoader();
    const queue = await bullQueueLoader();
    console.log("BullQueue loaded successfully");

    const openai = await OpenAILoader();
    console.log("OpenAILoader has been executed");

    await dependencyInjectionLoader({ openai, queue, pool });
    console.log("Dependency Injection loader has been executed.");

    await schedulerLoader();
    console.log("Scheduler loaded successfully");

    await expressLoader({ app });
    console.log("Express loader has been executed.");
};
