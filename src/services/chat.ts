import OpenAI from "openai";
import { Inject, Service } from "typedi";

@Service()
export default class ChatService {
    constructor(@Inject("openai") private readonly openai: OpenAI) {}
    askQuestion = async (question: string): Promise<string> => {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "ft:gpt-3.5-turbo-0125:personal::9jiz7x0F",
                messages: [{ role: "user", content: question }],
            });
            console.log(completion);
            return completion.choices[0].message.content as string;
        } catch (error) {
            console.error("Failed to generate response:", error);
            return "Sorry, I couldn't process your request at the moment.";
        }
    };
}
