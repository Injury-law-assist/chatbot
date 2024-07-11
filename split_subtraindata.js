const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "./train_data/result.json");
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        let allItems = [];
        for (const item of jsonData) {
            if (Array.isArray(item)) {
                allItems = allItems.concat(item);
            } else {
                allItems.push(item);
            }
        }

        const batchSize = 100;
        const numBatches = Math.ceil(allItems.length / batchSize);
        for (let i = 0; i < numBatches; i++) {
            const startIndex = i * batchSize;
            const endIndex = Math.min(startIndex + batchSize, allItems.length);
            const batch = allItems.slice(startIndex, endIndex);
            const subJsonData = JSON.stringify(batch, null, 2);
            const filename = `./train_data/subresult_${i + 1}.json`;
            const subFilePath = path.join(__dirname, filename);
            fs.writeFileSync(subFilePath, subJsonData, "utf8");
            console.log(`Subfile ${filename} has been saved.`);
        }
    } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
    }
});
