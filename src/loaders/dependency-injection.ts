import Bull from "bull";
import OpenAI from "openai";
import Container from "typedi";
import QueueMap from "../types/Queue";
import { Pool } from "mysql2/promise";
export default async function dependencyInjectionLoader({ openai, queue, pool }: { openai: OpenAI; queue: QueueMap; pool: Pool }) {
    Container.set("openai", openai);
    Object.entries(queue).forEach(([key, queue]) => {
        try {
            Container.set(key, queue);
            console.log(`Registered queue '${key}' in Container.`);
        } catch (error) {
            console.error(`Error registering queue '${key}':`, error);
            throw error;
        }
    });

    Container.set("pool", pool);
}
