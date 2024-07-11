import Bull from "bull";

export default interface QueueMap {
    [key: string]: Bull.Queue;
}
