import "reflect-metadata";
import express from "express";
import loaders from "./loaders";
export default async function createApp() {
    const app = express();
    await loaders({ app });
    return app;
}
