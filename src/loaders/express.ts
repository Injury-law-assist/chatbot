import { Application, json, urlencoded } from "express";
import dashboard from "../dashboard";

export default async function expressLoader({ app }: { app: Application }) {
    app.use(json());
    app.use(urlencoded({ extended: false }));

    app.use("/admin/queues", dashboard());
}
