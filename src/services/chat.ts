import { Pool } from "mysql2/promise";
import OpenAI from "openai";
import { Inject, Service } from "typedi";

@Service()
export default class ChatService {
    constructor(@Inject("openai") private readonly openai: OpenAI, @Inject("pool") private readonly pool: Pool) {}
    askQuestion = async (previousMessage: string | null, question: string): Promise<string> => {
        try {
            const fineTuningContent: string = previousMessage
                ? `당신의 이름은 산재처리 도우미 챗봇 입니다. 이제부터는 현재 대화 내용을 전달할 차례입니다. "${question}"라는 질문을 보냈습니다. 이를 이해하고 답변을 부탁드립니다. 상대방의 이름을 알고 있다면, '~님, ~에 대해 알려드릴 수 있습니다'와 같은 친절한 표현을 사용해 주세요. 가능한 많은 세부 정보를 포함하여 구체적으로 답변해 주시기 바랍니다. 답변이 마무리되면 고맙다는 인사를 추가해 주세요. 이전 메시지 정보: ${previousMessage} 이 정보를 참고해 주셔도 되고, 원치 않으시면 무시해도 괜찮습니다.(여기서 question은 저고, answer은 당신입니다.) 그러나 이는 관련된 내용일 수 있습니다.`
                : `당신의 이름은 산재처리 도우미 챗봇 입니다. 이제부터는 현재 대화 내용을 전달할 차례입니다. "${question}"라는 질문을 보냈습니다. 이를 이해하고 답변을 부탁드립니다. 상대방의 이름을 알고 있다면, '~님, ~에 대해 알려드릴 수 있습니다'와 같은 친절한 표현을 사용해 주세요. 가능한 많은 세부 정보를 포함하여 구체적으로 답변해 주시기 바랍니다. 답변이 마무리되면 고맙다는 인사를 추가해 주세요. 내용을 생략하지 말고 모든 정보를 포함하여 말씀해 주세요.`;

            console.log(fineTuningContent);
            const completion = await this.openai.chat.completions.create({
                model: "ft:gpt-3.5-turbo-0125:personal::9jiz7x0F",
                messages: [{ role: "user", content: fineTuningContent }],
            });
            console.log(completion);
            return completion.choices[0].message.content as string;
        } catch (error) {
            console.error("Failed to generate response:", error);
            return "Sorry, I couldn't process your request at the moment.";
        }
    };
    getPreviousMessage = async ({ roomId }: { roomId: number }): Promise<any> => {
        const connection = await this.pool.getConnection();
        try {
            const sql = `SELECT m_content from messages where cr_id = ? 
                    order by m_created_at DESC LIMIT 2`;

            const [result] = (await connection.query(sql, [roomId])) as [{ m_content: string }[], any];

            if (result && result.length > 0) {
                return { question: result[1].m_content, answer: result[0].m_content };
            } else {
                console.error(`No chat room found for roomId ${roomId}`);
            }
        } catch (error) {
            console.error("Error fetching chat room info:", error);
        } finally {
            connection.release();
        }
    };
    getChatRoomInfo = async ({ roomId }: { roomId: number }): Promise<any> => {
        const connection = await this.pool.getConnection();
        try {
            const sql = `SELECT u.u_id, u_nickname, cr.title AS cr_name 
                    FROM chatRooms cr, users u 
                    WHERE cr.u_id = u.u_id AND cr.cr_id = ? 
                    LIMIT 1`;

            const [result] = (await connection.query(sql, [roomId])) as [{ u_id: number; cr_name: string; u_nickname: string }[], any];

            if (result && result.length > 0) {
                return result[0];
            } else {
                console.error(`No chat room found for roomId ${roomId}`);
            }
        } catch (error) {
            console.error("Error fetching chat room info:", error);
        } finally {
            connection.release();
        }
    };
    createMessage = async ({ chatInfo }: { chatInfo: { roomId: number; userId: number; question: string; answer: string } }) => {
        const connection = await this.pool.getConnection();

        try {
            await connection.beginTransaction(); // 트랜잭션 시작

            // 메시지 데이터베이스에 저장
            await connection.query(`INSERT INTO messages (cr_id, u_id, m_content) VALUES (?, ?, ?)`, [chatInfo.roomId, chatInfo.userId, chatInfo.question]);
            await connection.query(`INSERT INTO messages (cr_id, u_id, m_content) VALUES (?, ?, ?)`, [chatInfo.roomId, chatInfo.userId, chatInfo.answer]);

            await connection.commit(); // 성공 시 트랜잭션 커밋
            console.log(`Message from room ${chatInfo.roomId} saved to database.`);
        } catch (error) {
            await connection.rollback(); // 실패 시 트랜잭션 롤백
            console.error(`Transaction failed and rolled back:`, error);
            throw error;
        } finally {
            connection.release();
        }
    };
}
