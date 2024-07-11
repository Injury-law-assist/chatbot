import createApp from "./app";
import http from "http";
import { init } from "./io";
import Bull from "bull";
import Container from "typedi";
import ChatService from "./services/chat";
import { Socket, Server } from "socket.io";
import { AnswerMessage, QuestionMessage } from "../ttypes/Message";

(async () => {
    const app = await createApp();
    const server = http.createServer(app);
    init(server);
    server.listen(3000, () => {
        console.log("server listening on 3000");
    });
})();
