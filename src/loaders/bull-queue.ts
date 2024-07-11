import Bull from "bull";
import QueueMap from "../types/Queue";

export default async function bullQueueLoader(): Promise<QueueMap> {
    const queueMap: QueueMap = {};
    const chatQueue = new Bull("chatQueue");
    queueMap[chatQueue.name] = chatQueue;
    return queueMap;
}
