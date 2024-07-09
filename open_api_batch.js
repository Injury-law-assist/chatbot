const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const secretKey = process.env.OPEN_API_SECRET_KEY;

const kinda = new Array();
const kindb = new Array();
const kindc = new Array();

const getKinda = async () => {
    try {
        const res = await axios.get(`https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentResultYuhyeongPstate?ServiceKey=${secretKey}&pageNo=1&numOfRows=6`);
        const { items } = res.data.response.body;

        for (let e of items.item) {
            kinda.push(e);
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
};
const getKindb = async () => {
    try {
        const res = await axios.get(`https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbSageonYuhyeongPstate?ServiceKey=${secretKey}&pageNo=1&numOfRows=12`);
        const { items } = res.data.response.body;
        for (let e of items.item) {
            kindb.push(e);
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
};

const getKindc = async () => {
    try {
        const res = await axios.get(
            "https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbSagoJilbyeongGubunPstate?ServiceKey=chxhHYTComHdBgaK%2BcALRSI8HPt%2BaAzFi%2BsWcA9n%2Fwl9bZ%2Fdru22tAPjLBzXW2ayQO7tfnA0BFif1UY0ldbrJA%3D%3D&pageNo=1&numOfRows=8"
        );
        const { items } = res.data.response.body;

        for (let e of items.item) {
            kindc.push(e);
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
};

const batchProcessJudicialPrecedent = async (kind) => {
    try {
        const [{ kinda }, { kindb }, { kindc }] = kind;
        // console.log(kind);
        const res = await axios.get(
            `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentNaeyongPstate?serviceKey=${secretKey}&pageNo=1&numOfRows=10&kindA=${kinda}&kindB=${kindb}&kindC=${kindc}`
        );
        //   console.log(res.data.response);
        const body = res.data.response.body;
        const totalCount = body.totalCount;
        if (totalCount !== 0) {
            const res = await axios.get(
                `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentNaeyongPstate?serviceKey=${secretKey}&pageNo=1&numOfRows=${totalCount}&kindA=${kinda}&kindB=${kindb}&kindC=${kindc}`
            );
            const items = res.data.response.body.items;
            // // JSON 파일에 append
            const filePath = path.join(__dirname, "result.json");
            let data = [];

            // 파일이 존재하면 기존 데이터를 읽어옴
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, "utf8");
                if (fileData) {
                    data = JSON.parse(fileData);
                }
            }

            // 새 데이터를 추가
            data.push(items.item);

            // JSON 파일에 다시 저장
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
};

async function main() {
    await getKinda();
    await getKindb();
    await getKindc();

    const result = [];

    // 세 개의 중첩된 반복문을 사용하여 모든 조합을 생성
    for (let i = 0; i < kinda.length; i++) {
        for (let j = 0; j < kindb.length; j++) {
            for (let k = 0; k < kindc.length; k++) {
                result.push([kinda[i], kindb[j], kindc[k]]);
            }
        }
    }
    for (const elements of result) {
        await batchProcessJudicialPrecedent(elements);
    }
}

//main();
