const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

const baseUrl = 'https://api.crazygames.com/v3/en_US/page/allGames';
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];  // 格式化为 YYYY-MM-DD

const paginationSize = 100;  // 每页的游戏数量
let currentPage = 1;  // 当前页码
let totalPages = 30;  // 设置总页数为 2（手动指定）

// 存储所有游戏的关键词
let allKeywords = [];

const fetchGames = async () => {
  while (currentPage <= totalPages) {
    const url = `${baseUrl}?paginationPage=${currentPage}&paginationSize=${paginationSize}`;
    
    try {
      const response = await axios.get(url);
      console.log(`Fetching page ${currentPage}:`, response.data);  // 打印响应数据以检查结构

      const games = response.data.games.items;
      
      // 提取关键词并添加到 allKeywords
      const keywords = games.map(game => game.seoKeyword);
      allKeywords = [...allKeywords, ...keywords];

      currentPage++;  // 增加页码

    } catch (error) {
      console.error(`Error fetching page ${currentPage}:`, error);
      process.exit(1);
    }
  }
};

const processKeywords = () => {
  // 排序并去重关键词
  const keywords = [...new Set(allKeywords)].sort();

  // 定义文件路径
  const keywordsFile = 'crazygames.txt';
  const diffFile = `crazygames_diff_${formattedDate}.txt`;

  // 读取现有的 keywords.txt 文件（如果存在）
  let previousKeywords = [];
  if (fs.existsSync(keywordsFile)) {
    previousKeywords = fs.readFileSync(keywordsFile, 'utf-8').split('\n');
  }

  // 找到差异：diffData 是新数据中存在而旧数据中没有的关键词
  const diffData = keywords.filter(keyword => !previousKeywords.includes(keyword));

  // 将差异数据写入到 diff 文件
  if (diffData.length > 0) {
    fs.writeFileSync(diffFile, diffData.join('\n'), 'utf-8');
  } else {
    console.log('No new keywords to write to diff file.');
  }

  // 将最新的关键词写入 crazygames.txt 文件
  fs.writeFileSync(keywordsFile, keywords.join('\n'), 'utf-8');
};

const commitChanges = () => {
  // 将文件添加到 Git 仓库并提交
  execSync('git config --global user.name "github-actions"');
  execSync('git config --global user.email "actions@github.com"');
  execSync('git add .');
  execSync('git commit -m "Update CrazyGames keywords"');
  execSync('git push');
};

const main = async () => {
  await fetchGames();  // 获取所有页的数据
  processKeywords();  // 处理关键词
  commitChanges();    // 提交到 Git
};

main();
