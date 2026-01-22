const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * 钱包生成器类
 * 用于创建以太坊钱包并将所有钱包信息保存到同一个文件中
 */
class WalletGenerator {
    /**
     * 构造函数
     * @param {string} outputDir - 钱包文件保存目录
     */
    constructor(outputDir = './wallets') {
        this.outputDir = outputDir;
        this.logDir = './logs';
        // 确保输出目录存在
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        // 确保日志目录存在
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * 生成新的以太坊钱包
     * @returns {Object} 包含钱包地址和私钥的对象
     */
    generateWallet() {
        try {
            // 生成随机钱包
            const wallet = ethers.Wallet.createRandom();

            return {
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : null
            };
        } catch (error) {
            console.error('生成钱包失败:', error.message);
            throw error;
        }
    }

    /**
     * 保存钱包信息到同一个文件中
     * @param {Object} walletInfo - 钱包信息对象
     * @param {string} filename - 文件名，默认为wallets.json
     * @returns {string} 保存的文件路径
     */
    saveWalletToFile(walletInfo, filename = 'wallets.json') {
        try {
            const { address, privateKey, mnemonic } = walletInfo;

            // 固定文件路径，所有钱包都保存在同一个文件中
            const filePath = path.join(this.outputDir, filename);

            // 准备要保存的钱包数据
            const walletData = {
                address,
                privateKey,
                timestamp: new Date().toISOString(),
                chainId: 1, // 默认以太坊主网
                note: '请妥善保管此文件，不要分享给他人！'
            };

            // 如果有助记词，也保存下来
            if (mnemonic) {
                walletData.mnemonic = mnemonic;
            }

            // 读取现有文件内容（如果存在）
            let wallets = [];
            if (fs.existsSync(filePath)) {
                const existingData = fs.readFileSync(filePath, 'utf8');
                if (existingData.trim()) {
                    try {
                        wallets = JSON.parse(existingData);
                        // 确保wallets是数组
                        if (!Array.isArray(wallets)) {
                            wallets = [wallets];
                        }
                    } catch (parseError) {
                        console.warn('解析现有钱包文件失败，创建新文件:', parseError.message);
                        wallets = [];
                    }
                }
            }

            // 检查是否已存在相同地址的钱包
            const existingIndex = wallets.findIndex(wallet => wallet.address === address);
            if (existingIndex !== -1) {
                // 更新现有钱包
                wallets[existingIndex] = walletData;
                console.log(`已更新地址为 ${address} 的钱包信息`);
            } else {
                // 添加新钱包
                wallets.push(walletData);
                console.log(`已添加新钱包地址: ${address}`);
            }

            // 写回文件
            fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2));

            console.log(`所有钱包信息已保存到: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('保存钱包文件失败:', error.message);
            throw error;
        }
    }
    /**
     * 批量生成钱包并保存到同一个文件
     * @param {number} count - 要生成的钱包数量
     * @returns {Array} 包含所有生成钱包信息的数组
     */
    generateMultipleWallets(count) {
        const wallets = [];
        const 统一文件名 = 'wallets.json'; // 所有钱包都保存到这个文件

        console.log(`开始生成 ${count} 个钱包...`);
        console.log(`所有钱包将保存到同一个文件: ${this.outputDir}/${统一文件名}`);

        for (let i = 0; i < count; i++) {
            try {
                console.log(`生成钱包 ${i + 1}/${count}`);
                const walletInfo = this.generateWallet();
                // 使用统一的文件名，不再为每个钱包生成不同的文件名
                const filePath = this.saveWalletToFile(walletInfo, 统一文件名);

                wallets.push({
                    ...walletInfo,
                    filePath
                });
            } catch (error) {
                console.error(`生成钱包 ${i + 1} 失败:`, error.message);
            }
        }

        console.log(`钱包生成完成，共成功生成 ${wallets.length} 个钱包，所有钱包信息已保存到 ${this.outputDir}/${统一文件名}`);
        return wallets;
    }

    /**
     * 生成单个钱包并显示安全提示
     * @returns {Object} 生成的钱包信息
     */
    generateSingleWalletWithWarning() {
        // 显示安全警告
        console.log('====================================================');
        console.log('⚠️  安全警告 ⚠️');
        console.log('此操作将生成一个新的以太坊钱包并保存私钥到文件');
        console.log('私钥是访问您资金的唯一凭证，请务必：');
        console.log('1. 妥善保管生成的文件');
        console.log('2. 不要分享给任何人');
        console.log('3. 考虑额外的加密保护');
        console.log('4. 备份到安全的位置');
        console.log('====================================================');

        // 生成并保存钱包到统一的文件
        const walletInfo = this.generateWallet();
        const 统一文件名 = 'wallets.json';
        const filePath = this.saveWalletToFile(walletInfo, 统一文件名);

        console.log('钱包生成成功!');
        console.log(`地址: ${walletInfo.address}`);
        console.log(`私钥已保存到文件: ${filePath} (出于安全考虑不显示)`);
        if (walletInfo.mnemonic) {
            console.log(`助记词已保存到文件: ${filePath} (出于安全考虑不显示)`);
        }
        console.log(`该钱包信息将与其他钱包一起存储在 ${filePath}`);

        return {
            ...walletInfo,
            filePath
        };
    }

    /**
     * 读取所有保存的钱包信息
     * @param {string} filename - 文件名，默认为wallets.json
     * @returns {Array} 所有钱包信息的数组
     */
    readAllWallets(filename = 'wallets.json') {
        try {
            const filePath = path.join(this.outputDir, filename);

            if (!fs.existsSync(filePath)) {
                console.log(`钱包文件不存在: ${filePath}`);
                return [];
            }

            const fileData = fs.readFileSync(filePath, 'utf8');
            if (!fileData.trim()) {
                return [];
            }

            const wallets = JSON.parse(fileData);
            return Array.isArray(wallets) ? wallets : [wallets];
        } catch (error) {
            console.error('读取钱包文件失败:', error.message);
            return [];
        }
    }

    /**
     * 根据地址查找特定钱包
     * @param {string} address - 钱包地址
     * @param {string} filename - 文件名，默认为wallets.json
     * @returns {Object|null} 找到的钱包信息或null
     */
    findWalletByAddress(address, filename = 'wallets.json') {
        const wallets = this.readAllWallets(filename);
        return wallets.find(wallet => wallet.address.toLowerCase() === address.toLowerCase()) || null;
    }

    /**
     * 记录日志到文件
     * @param {string} message - 日志消息
     * @param {string} logFileName - 日志文件名
     */
    logToFile(message, logFileName) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        const logPath = path.join(this.logDir, logFileName);
        console.log(message);
        fs.appendFileSync(logPath, logMessage);
    }

    /**
     * 将指定地址中的ETH随机分配并转入到wallets.json中的每个地址
     * @param {string} sourcePrivateKey - 源地址私钥
     * @param {string} rpcUrl - RPC节点URL
     * @param {Object} options - 转账选项
     * @returns {Promise<Array>} 转账结果数组
     */
    async distributeEthFromSource1(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'eth_transfer.log';
        const {
            minAmount = 0.001,
            maxAmount = 0.01
        } = options;

        try {
            this.logToFile(`开始ETH分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);

            // 获取源地址ETH余额
            const ethBalance = await provider.getBalance(sourceAddress);
            this.logToFile(`源地址ETH余额: ${ethers.utils.formatEther(ethBalance)} ETH`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账ETH...`, logFileName);

            // 转账结果
            const results = [];

            // 为每个目标地址转账ETH
            for (let i = 0; i < targetWallets.length; i++) {
                const targetWallet = targetWallets[i];
                const targetAddress = targetWallet.address;

                this.logToFile(`处理第 ${i + 1}/${targetWallets.length} 个地址: ${targetAddress}`, logFileName);

                // 生成随机金额
                const ethAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                this.logToFile(`随机ETH金额: ${ethAmount.toFixed(6)} ETH`, logFileName);

                try {
                    const ethValue = ethers.utils.parseEther(ethAmount.toFixed(18));
                    const gasPrice = await provider.getGasPrice();
                    const gasLimit = 21000; // ETH转账标准gas
                    const transactionCost = gasPrice.mul(gasLimit);

                    // 检查余额是否足够
                    if (ethBalance.lt(ethValue.add(transactionCost))) {
                        const errorMsg = `ETH余额不足，跳过转账`;
                        this.logToFile(errorMsg, logFileName);
                        results.push({
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: "ETH余额不足"
                        });
                        continue;
                    }

                    // 发送ETH交易
                    const tx = await sourceWallet.sendTransaction({
                        to: targetAddress,
                        value: ethValue,
                        gasLimit: gasLimit,
                        gasPrice: gasPrice
                    });

                    this.logToFile(`ETH转账交易已发送: ${tx.hash}`, logFileName);
                    await tx.wait();
                    this.logToFile(`ETH转账成功`, logFileName);

                    results.push({
                        targetAddress,
                        success: true,
                        amount: ethAmount,
                        txHash: tx.hash
                    });

                } catch (error) {
                    const errorMsg = `ETH转账失败: ${error.message}`;
                    this.logToFile(errorMsg, logFileName);
                    results.push({
                        targetAddress,
                        success: false,
                        amount: 0,
                        error: `ETH转账失败: ${error.message}`
                    });
                }
            }

            // 输出汇总结果
            this.logToFile("=== ETH转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalEthSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalEthSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalEthSent.toFixed(6)} ETH`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发ETH过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
     * 将指定地址中的ETH随机分配并转入到wallets.json中的每个地址（优化版）
     * @param {string} sourcePrivateKey - 源地址私钥
     * @param {string} rpcUrl - RPC节点URL
     * @param {Object} options - 转账选项
     * @returns {Promise<Array>} 转账结果数组
     */
    async distributeEthFromSource(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'eth_transfer.log';
        const {
            minAmount = 0.001,
            maxAmount = 0.01,
            maxConcurrency = 5, // 最大并发数
            gasPriceMultiplier = 1.2 // Gas价格倍数
        } = options;

        try {
            this.logToFile(`开始ETH分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);

            // 获取源地址ETH余额
            const ethBalance = await provider.getBalance(sourceAddress);
            this.logToFile(`源地址ETH余额: ${ethers.utils.formatEther(ethBalance)} ETH`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账ETH...`, logFileName);

            // 控制并发数的辅助函数
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // 并行处理转账
            const results = [];
            const batches = [];

            // 将目标钱包分批处理
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                batches.push(targetWallets.slice(i, i + maxConcurrency));
            }

            // 计算总需要的ETH金额用于余额检查
            let totalRequiredEth = ethers.BigNumber.from(0);
            const individualAmounts = [];

            // 预先计算所有转账金额
            for (let i = 0; i < targetWallets.length; i++) {
                const ethAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                individualAmounts.push(ethAmount);
                totalRequiredEth = totalRequiredEth.add(ethers.utils.parseEther(ethAmount.toFixed(18)));
            }

            // 添加预估的gas费用
            const gasPrice = await provider.getGasPrice();
            const estimatedGasCost = gasPrice.mul(21000).mul(targetWallets.length);
            totalRequiredEth = totalRequiredEth.add(estimatedGasCost);

            // 检查总余额是否足够
            if (ethBalance.lt(totalRequiredEth)) {
                const errorMsg = `ETH总余额不足，跳过转账任务`;
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            // 按批次处理转账
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                this.logToFile(`处理第 ${batchIndex + 1}/${batches.length} 批次，包含 ${batch.length} 个地址`, logFileName);

                // 并行处理当前批次
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const globalIndex = batchIndex * maxConcurrency + indexInBatch;
                    const targetAddress = targetWallet.address;
                    const ethAmount = individualAmounts[globalIndex];

                    this.logToFile(`处理第 ${globalIndex + 1} 个地址: ${targetAddress}`, logFileName);
                    this.logToFile(`随机ETH金额: ${ethAmount.toFixed(6)} ETH`, logFileName);

                    try {
                        const ethValue = ethers.utils.parseEther(ethAmount.toFixed(18));
                        const currentGasPrice = (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100);
                        const gasLimit = 21000; // ETH转账标准gas

                        // 检查单笔交易余额是否足够
                        const transactionCost = currentGasPrice.mul(gasLimit).add(ethValue);
                        const currentBalance = await provider.getBalance(sourceAddress);

                        if (currentBalance.lt(transactionCost)) {
                            const errorMsg = `ETH余额不足，跳过转账`;
                            this.logToFile(errorMsg, logFileName);
                            return {
                                targetAddress,
                                success: false,
                                amount: 0,
                                error: "ETH余额不足"
                            };
                        }

                        // 发送ETH交易
                        const tx = await sourceWallet.sendTransaction({
                            to: targetAddress,
                            value: ethValue,
                            gasLimit: gasLimit,
                            gasPrice: currentGasPrice
                        });

                        this.logToFile(`ETH转账交易已发送: ${tx.hash}`, logFileName);
                        await tx.wait();
                        this.logToFile(`ETH转账成功`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: ethAmount,
                            txHash: tx.hash
                        };

                    } catch (error) {
                        const errorMsg = `ETH转账失败: ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: `ETH转账失败: ${error.message}`
                        };
                    }
                });

                // 等待当前批次完成
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 批次间短暂延迟，避免网络压力过大
                if (batchIndex < batches.length - 1) {
                    await sleep(500);
                }
            }

            // 输出汇总结果
            this.logToFile("=== ETH转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalEthSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalEthSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalEthSent.toFixed(6)} ETH`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发ETH过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
     * 将指定地址中的USDT随机分配并转入到wallets.json中的每个地址
     * @param {string} sourcePrivateKey - 源地址私钥
     * @param {string} rpcUrl - RPC节点URL
     * @param {Object} options - 转账选项
     * @returns {Promise<Array>} 转账结果数组
     */
    async distributeUsdtFromSource1(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'usdt_transfer.log';
        const {
            minAmount = 10,
            maxAmount = 100,
            usdtContractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7" // ETH主网USDT地址
        } = options;

        try {
            this.logToFile(`开始USDT分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);

            // USDT合约ABI
            const usdtAbi = [
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address, uint256) returns (bool)"
            ];
            console.log(usdtContractAddress);
            // 获取USDT余额
            const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);
            const usdtBalance = await usdtContract.balanceOf(sourceAddress);
            this.logToFile(`源地址USDT余额: ${ethers.utils.formatUnits(usdtBalance, 6)} USDT`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账USDT...`, logFileName);

            // 转账结果
            const results = [];

            // 为每个目标地址转账USDT
            for (let i = 0; i < 2; i++) {
                // for (let i = 0; i < targetWallets.length; i++) {
                const targetWallet = targetWallets[i];
                const targetAddress = targetWallet.address;

                this.logToFile(`处理第 ${i + 1}/${targetWallets.length} 个地址: ${targetAddress}`, logFileName);

                // 生成随机金额
                const usdtAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                this.logToFile(`随机USDT金额: ${usdtAmount.toFixed(6)} USDT`, logFileName);

                try {
                    const usdtValue = ethers.utils.parseUnits(usdtAmount.toFixed(6), 6);

                    // 检查USDT余额是否足够
                    if (usdtBalance.lt(usdtValue)) {
                        const errorMsg = `USDT余额不足，跳过转账`;
                        this.logToFile(errorMsg, logFileName);
                        results.push({
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: "USDT余额不足"
                        });
                        continue;
                    }

                    // 发送USDT交易
                    const tx = await usdtContract.connect(sourceWallet).transfer(
                        targetAddress,
                        usdtValue
                    );

                    this.logToFile(`USDT转账交易已发送: ${tx.hash}`, logFileName);
                    await tx.wait();
                    this.logToFile(`USDT转账成功`, logFileName);

                    results.push({
                        targetAddress,
                        success: true,
                        amount: usdtAmount,
                        txHash: tx.hash
                    });

                } catch (error) {
                    const errorMsg = `USDT转账失败: ${error.message}`;
                    this.logToFile(errorMsg, logFileName);
                    results.push({
                        targetAddress,
                        success: false,
                        amount: 0,
                        error: `USDT转账失败: ${error.message}`
                    });
                }
            }

            // 输出汇总结果
            this.logToFile("=== USDT转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalUsdtSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalUsdtSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalUsdtSent.toFixed(6)} USDT`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发USDT过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
 * 将指定地址中的ETH随机分配并转入到wallets.json中的每个地址（nonce管理优化版）
 * @param {string} sourcePrivateKey - 源地址私钥
 * @param {string} rpcUrl - RPC节点URL
 * @param {Object} options - 转账选项
 * @returns {Promise<Array>} 转账结果数组
 */
    async distributeEthFromSource2(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'eth_transfer.log';
        const {
            minAmount = 0.001,
            maxAmount = 0.01,
            maxConcurrency = 10, // 增加并发数
            gasPriceMultiplier = 1.3 // 提高gas price确保快速确认
        } = options;

        try {
            this.logToFile(`开始ETH分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);

            // 获取源地址ETH余额和nonce
            const ethBalance = await provider.getBalance(sourceAddress);
            const startNonce = await provider.getTransactionCount(sourceAddress, 'latest');
            this.logToFile(`源地址ETH余额: ${ethers.utils.formatEther(ethBalance)} ETH`, logFileName);
            this.logToFile(`起始nonce: ${startNonce}`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账ETH...`, logFileName);

            // 预先计算所有转账金额
            const transferAmounts = [];
            let totalEthRequired = ethers.BigNumber.from(0);

            for (let i = 0; i < targetWallets.length; i++) {
                const ethAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                transferAmounts.push(ethAmount);
                totalEthRequired = totalEthRequired.add(ethers.utils.parseEther(ethAmount.toFixed(18)));
            }

            // 预估总gas费用
            const gasPrice = (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100);
            const estimatedGasCost = gasPrice.mul(21000).mul(targetWallets.length);
            totalEthRequired = totalEthRequired.add(estimatedGasCost);

            // 检查总余额
            if (ethBalance.lt(totalEthRequired)) {
                const errorMsg = `ETH总余额不足，需要: ${ethers.utils.formatEther(totalEthRequired)} ETH, 实际: ${ethers.utils.formatEther(ethBalance)} ETH`;
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            // 使用nonce管理并发执行转账
            const results = [];
            const gasLimit = 21000;

            // 分批处理以避免nonce冲突
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                const batch = targetWallets.slice(i, Math.min(i + maxConcurrency, targetWallets.length));
                this.logToFile(`处理批次: ${Math.floor(i / maxConcurrency) + 1}, 包含 ${batch.length} 个交易`, logFileName);

                // 为当前批次创建带nonce的交易
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const globalIndex = i + indexInBatch;
                    const targetAddress = targetWallet.address;
                    const ethAmount = transferAmounts[globalIndex];

                    this.logToFile(`准备转账到: ${targetAddress}, 金额: ${ethAmount.toFixed(6)} ETH`, logFileName);

                    try {
                        const ethValue = ethers.utils.parseEther(ethAmount.toFixed(18));
                        const nonce = startNonce + globalIndex;

                        // 构建交易对象
                        const tx = {
                            to: targetAddress,
                            value: ethValue,
                            gasLimit: gasLimit,
                            gasPrice: gasPrice,
                            nonce: nonce
                        };

                        // 签名并发送交易
                        const signedTx = await sourceWallet.signTransaction(tx);
                        const txResponse = await provider.sendTransaction(signedTx);

                        this.logToFile(`ETH转账已发送, nonce: ${nonce}, hash: ${txResponse.hash}`, logFileName);

                        // 等待交易确认
                        await txResponse.wait();
                        this.logToFile(`ETH转账成功, nonce: ${nonce}`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: ethAmount,
                            txHash: txResponse.hash,
                            nonce: nonce
                        };

                    } catch (error) {
                        const errorMsg = `ETH转账失败 (${targetAddress}): ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: errorMsg,
                            nonce: startNonce + globalIndex
                        };
                    }
                });

                // 并发执行当前批次的所有交易
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 短暂延迟避免RPC压力过大
                if (i + maxConcurrency < targetWallets.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 输出汇总结果
            this.logToFile("=== ETH转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalEthSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalEthSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalEthSent.toFixed(6)} ETH`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发ETH过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
 * 将指定地址中的ETH随机分配并转入到wallets.json中的每个地址（带chainId优化版）
 * @param {string} sourcePrivateKey - 源地址私钥
 * @param {string} rpcUrl - RPC节点URL
 * @param {Object} options - 转账选项
 * @returns {Promise<Array>} 转账结果数组
 */
    async distributeEthFromSource3(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'eth_transfer.log';
        const {
            minAmount = 0.001,
            maxAmount = 0.01,
            maxConcurrency = 10,
            gasPriceMultiplier = 1.3
        } = options;

        try {
            this.logToFile(`开始ETH分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);

            // 获取源地址ETH余额和nonce
            const ethBalance = await provider.getBalance(sourceAddress);
            const startNonce = await provider.getTransactionCount(sourceAddress, 'latest');
            const network = await provider.getNetwork();
            const chainId = network.chainId;

            this.logToFile(`源地址ETH余额: ${ethers.utils.formatEther(ethBalance)} ETH`, logFileName);
            this.logToFile(`起始nonce: ${startNonce}`, logFileName);
            this.logToFile(`Chain ID: ${chainId}`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账ETH...`, logFileName);

            // 预先计算所有转账金额
            const transferAmounts = [];
            let totalEthRequired = ethers.BigNumber.from(0);

            for (let i = 0; i < targetWallets.length; i++) {
                const ethAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                transferAmounts.push(ethAmount);
                totalEthRequired = totalEthRequired.add(ethers.utils.parseEther(ethAmount.toFixed(18)));
            }

            // 预估总gas费用
            const gasPrice = (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100);
            const estimatedGasCost = gasPrice.mul(21000).mul(targetWallets.length);
            totalEthRequired = totalEthRequired.add(estimatedGasCost);

            // 检查总余额
            if (ethBalance.lt(totalEthRequired)) {
                const errorMsg = `ETH总余额不足，需要: ${ethers.utils.formatEther(totalEthRequired)} ETH, 实际: ${ethers.utils.formatEther(ethBalance)} ETH`;
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            // 使用nonce管理并发执行转账
            const results = [];
            const gasLimit = 21000;

            // 分批处理以避免nonce冲突
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                const batch = targetWallets.slice(i, Math.min(i + maxConcurrency, targetWallets.length));
                this.logToFile(`处理批次: ${Math.floor(i / maxConcurrency) + 1}, 包含 ${batch.length} 个交易`, logFileName);

                // 为当前批次创建带nonce的交易
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const globalIndex = i + indexInBatch;
                    const targetAddress = targetWallet.address;
                    const ethAmount = transferAmounts[globalIndex];

                    this.logToFile(`准备转账到: ${targetAddress}, 金额: ${ethAmount.toFixed(6)} ETH`, logFileName);

                    try {
                        const ethValue = ethers.utils.parseEther(ethAmount.toFixed(18));
                        const nonce = startNonce + globalIndex;

                        // 构建交易对象，包含chainId字段
                        const tx = {
                            to: targetAddress,
                            value: ethValue,
                            gasLimit: gasLimit,
                            gasPrice: gasPrice,
                            nonce: nonce,
                            chainId: chainId  // 添加chainId字段
                        };

                        // 签名并发送交易
                        const signedTx = await sourceWallet.signTransaction(tx);
                        const txResponse = await provider.sendTransaction(signedTx);

                        this.logToFile(`ETH转账已发送, nonce: ${nonce}, hash: ${txResponse.hash}`, logFileName);

                        // 等待交易确认
                        await txResponse.wait();
                        this.logToFile(`ETH转账成功, nonce: ${nonce}`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: ethAmount,
                            txHash: txResponse.hash,
                            nonce: nonce,
                            chainId: chainId
                        };

                    } catch (error) {
                        const errorMsg = `ETH转账失败 (${targetAddress}): ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: errorMsg,
                            nonce: startNonce + globalIndex,
                            chainId: chainId
                        };
                    }
                });

                // 并发执行当前批次的所有交易
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 短暂延迟避免RPC压力过大
                if (i + maxConcurrency < targetWallets.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 输出汇总结果
            this.logToFile("=== ETH转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalEthSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalEthSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalEthSent.toFixed(6)} ETH`, logFileName);
            this.logToFile(`使用的Chain ID: ${chainId}`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发ETH过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
     * 将指定地址中的ETH随机分配并转入到wallets.json中的每个地址（支持自定义decimals）
     * @param {string} sourcePrivateKey - 源地址私钥
     * @param {string} rpcUrl - RPC节点URL
     * @param {Object} options - 转账选项
     * @returns {Promise<Array>} 转账结果数组
     */
    async distributeEthFromSource4(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'eth_transfer.log';
        const {
            minAmount = 0.001,
            maxAmount = 0.01,
            maxConcurrency = 10,
            gasPriceMultiplier = 1.3,
            decimals = 18  // 添加decimals参数，默认为18（ETH标准）
        } = options;

        try {
            this.logToFile(`开始ETH分发任务 (decimals: ${decimals})`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            // 获取网络信息
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            const startNonce = await provider.getTransactionCount(sourceAddress, 'latest');

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);
            this.logToFile(`Chain ID: ${chainId}`, logFileName);
            this.logToFile(`起始nonce: ${startNonce}`, logFileName);

            // 获取源地址ETH余额
            const ethBalance = await provider.getBalance(sourceAddress);
            this.logToFile(`源地址ETH余额: ${ethers.utils.formatUnits(ethBalance, decimals)} ETH`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账ETH...`, logFileName);

            // 预先计算所有转账金额
            const transferAmounts = [];
            let totalEthRequired = ethers.BigNumber.from(0);

            for (let i = 0; i < targetWallets.length; i++) {
                const ethAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                transferAmounts.push(ethAmount);
                totalEthRequired = totalEthRequired.add(ethers.utils.parseUnits(ethAmount.toFixed(decimals), decimals));
            }

            // 预估总gas费用
            const gasPrice = (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100);
            const estimatedGasCost = gasPrice.mul(21000).mul(targetWallets.length);
            totalEthRequired = totalEthRequired.add(estimatedGasCost);

            // 检查总余额
            if (ethBalance.lt(totalEthRequired)) {
                const errorMsg = `ETH总余额不足，需要: ${ethers.utils.formatUnits(totalEthRequired, decimals)} ETH, 实际: ${ethers.utils.formatUnits(ethBalance, decimals)} ETH`;
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            // 使用nonce管理并发执行转账
            const results = [];
            const gasLimit = 21000;

            // 分批处理以避免nonce冲突
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                const batch = targetWallets.slice(i, Math.min(i + maxConcurrency, targetWallets.length));
                this.logToFile(`处理批次: ${Math.floor(i / maxConcurrency) + 1}, 包含 ${batch.length} 个交易`, logFileName);

                // 为当前批次创建带nonce的交易
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const globalIndex = i + indexInBatch;
                    const targetAddress = targetWallet.address;
                    const ethAmount = transferAmounts[globalIndex];

                    this.logToFile(`准备转账到: ${targetAddress}, 金额: ${ethAmount.toFixed(decimals)} ETH`, logFileName);

                    try {
                        // 使用自定义decimals解析金额
                        const ethValue = ethers.utils.parseUnits(ethAmount.toFixed(decimals), decimals);
                        const nonce = startNonce + globalIndex;

                        // 构建交易对象，包含chainId字段
                        const tx = {
                            to: targetAddress,
                            value: ethValue,
                            gasLimit: gasLimit,
                            gasPrice: gasPrice,
                            nonce: nonce,
                            chainId: chainId
                        };

                        // 签名并发送交易
                        const signedTx = await sourceWallet.signTransaction(tx);
                        const txResponse = await provider.sendTransaction(signedTx);

                        this.logToFile(`ETH转账已发送, nonce: ${nonce}, hash: ${txResponse.hash}`, logFileName);

                        // 等待交易确认
                        await txResponse.wait();
                        this.logToFile(`ETH转账成功, nonce: ${nonce}`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: ethAmount,
                            txHash: txResponse.hash,
                            nonce: nonce,
                            chainId: chainId
                        };

                    } catch (error) {
                        const errorMsg = `ETH转账失败 (${targetAddress}): ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: errorMsg,
                            nonce: startNonce + globalIndex,
                            chainId: chainId
                        };
                    }
                });

                // 并发执行当前批次的所有交易
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 短暂延迟避免RPC压力过大
                if (i + maxConcurrency < targetWallets.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 输出汇总结果
            this.logToFile("=== ETH转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalEthSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalEthSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalEthSent.toFixed(decimals)} ETH`, logFileName);
            this.logToFile(`使用的Chain ID: ${chainId}`, logFileName);
            this.logToFile(`使用的decimals: ${decimals}`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发ETH过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
 * 将指定地址中的USDT随机分配并转入到wallets.json中的每个地址（优化版）
 * @param {string} sourcePrivateKey - 源地址私钥
 * @param {string} rpcUrl - RPC节点URL
 * @param {Object} options - 转账选项
 * @returns {Promise<Array>} 转账结果数组
 */
    async distributeUsdtFromSource2(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'usdt_transfer.log';
        const {
            minAmount = 10,
            maxAmount = 100,
            usdtContractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            maxConcurrency = 5, // 最大并发数
            gasPriceMultiplier = 1.2, // Gas价格倍数
            gasLimit = 100000 // 固定gas限制
        } = options;
        console.log(usdtContractAddress);
        console.log(maxAmount);
        try {
            this.logToFile(`开始USDT分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);

            // USDT合约ABI
            const usdtAbi = [
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address, uint256) returns (bool)"
            ];

            // 获取USDT余额
            const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);
            const usdtBalance = await usdtContract.balanceOf(sourceAddress);
            this.logToFile(`源地址USDT余额: ${ethers.utils.formatUnits(usdtBalance, 6)} USDT`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            // const targetWallets = 2;
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账USDT...`, logFileName);

            // 控制并发数的辅助函数
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // 并行处理转账
            const results = [];
            const batches = [];

            // 将目标钱包分批处理
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                // for (let i = 0; i < 2; i += maxConcurrency) {
                batches.push(targetWallets.slice(i, i + maxConcurrency));
            }

            // 按批次处理转账
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                this.logToFile(`处理第 ${batchIndex + 1}/${batches.length} 批次，包含 ${batch.length} 个地址`, logFileName);

                // 并行处理当前批次
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const targetAddress = targetWallet.address;
                    this.logToFile(`处理地址: ${targetAddress}`, logFileName);

                    // 生成随机金额
                    const usdtAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                    this.logToFile(`随机USDT金额: ${usdtAmount.toFixed(6)} USDT`, logFileName);

                    try {
                        const usdtValue = ethers.utils.parseUnits(usdtAmount.toFixed(6), 6);

                        // 检查USDT余额是否足够
                        const currentBalance = await usdtContract.balanceOf(sourceAddress);
                        if (currentBalance.lt(usdtValue)) {
                            const errorMsg = `USDT余额不足，跳过转账`;
                            this.logToFile(errorMsg, logFileName);
                            return {
                                targetAddress,
                                success: false,
                                amount: 0,
                                error: "USDT余额不足"
                            };
                        }

                        // 获取优化的 gas 设置
                        const gasPrice = (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100);

                        // 发送USDT交易
                        const tx = await usdtContract.connect(sourceWallet).transfer(
                            targetAddress,
                            usdtValue,
                            {
                                gasPrice: gasPrice,
                                gasLimit: gasLimit
                            }
                        );

                        this.logToFile(`USDT转账交易已发送: ${tx.hash}`, logFileName);
                        await tx.wait();
                        this.logToFile(`USDT转账成功`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: usdtAmount,
                            txHash: tx.hash
                        };

                    } catch (error) {
                        const errorMsg = `USDT转账失败: ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: `USDT转账失败: ${error.message}`
                        };
                    }
                });

                // 等待当前批次完成
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 批次间短暂延迟，避免网络压力过大
                if (batchIndex < batches.length - 1) {
                    await sleep(1000);
                }
            }

            // 输出汇总结果
            this.logToFile("=== USDT转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalUsdtSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalUsdtSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalUsdtSent.toFixed(6)} USDT`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发USDT过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
 * 将指定地址中的USDT随机分配并转入到wallets.json中的每个地址（nonce管理优化版）
 * @param {string} sourcePrivateKey - 源地址私钥
 * @param {string} rpcUrl - RPC节点URL
 * @param {Object} options - 转账选项
 * @returns {Promise<Array>} 转账结果数组
 */
    async distributeUsdtFromSource3(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'usdt_transfer.log';
        const {
            minAmount = 10,
            maxAmount = 100,
            usdtContractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            maxConcurrency = 10, // 增加并发数
            gasPriceMultiplier = 1.3, // 提高gas price确保快速确认
            gasLimit = 100000
        } = options;

        try {
            this.logToFile(`开始USDT分发任务`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            // 获取网络信息
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            const startNonce = await provider.getTransactionCount(sourceAddress, 'latest');

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);
            this.logToFile(`Chain ID: ${chainId}`, logFileName);
            this.logToFile(`起始nonce: ${startNonce}`, logFileName);

            // USDT合约ABI
            const usdtAbi = [
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address, uint256) returns (bool)"
            ];

            // 获取USDT余额
            const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);
            const usdtBalance = await usdtContract.balanceOf(sourceAddress);
            this.logToFile(`源地址USDT余额: ${ethers.utils.formatUnits(usdtBalance, 6)} USDT`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账USDT...`, logFileName);

            // 预先计算所有转账金额
            const transferAmounts = [];
            for (let i = 0; i < targetWallets.length; i++) {
                const usdtAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                transferAmounts.push(usdtAmount);
            }

            // 使用nonce管理并发执行转账
            const results = [];

            // 分批处理以避免nonce冲突
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                const batch = targetWallets.slice(i, Math.min(i + maxConcurrency, targetWallets.length));
                this.logToFile(`处理批次: ${Math.floor(i / maxConcurrency) + 1}, 包含 ${batch.length} 个交易`, logFileName);

                // 为当前批次创建带nonce的交易
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const globalIndex = i + indexInBatch;
                    const targetAddress = targetWallet.address;
                    const usdtAmount = transferAmounts[globalIndex];

                    this.logToFile(`准备转账到: ${targetAddress}, 金额: ${usdtAmount.toFixed(6)} USDT`, logFileName);

                    try {
                        const usdtValue = ethers.utils.parseUnits(usdtAmount.toFixed(6), 6);
                        const nonce = startNonce + globalIndex;

                        // 检查USDT余额是否足够
                        const currentBalance = await usdtContract.balanceOf(sourceAddress);
                        if (currentBalance.lt(usdtValue)) {
                            const errorMsg = `USDT余额不足，跳过转账`;
                            this.logToFile(errorMsg, logFileName);
                            return {
                                targetAddress,
                                success: false,
                                amount: 0,
                                error: "USDT余额不足",
                                nonce: nonce,
                                chainId: chainId
                            };
                        }

                        // 构建USDT转账交易数据
                        const transferData = usdtContract.interface.encodeFunctionData("transfer", [
                            targetAddress,
                            usdtValue
                        ]);

                        // 构建交易对象，包含chainId字段
                        const tx = {
                            to: usdtContractAddress,
                            data: transferData,
                            gasLimit: gasLimit,
                            gasPrice: (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100),
                            nonce: nonce,
                            chainId: chainId  // 添加chainId字段
                        };

                        // 签名并发送交易
                        const signedTx = await sourceWallet.signTransaction(tx);
                        const txResponse = await provider.sendTransaction(signedTx);

                        this.logToFile(`USDT转账已发送, nonce: ${nonce}, hash: ${txResponse.hash}`, logFileName);

                        // 等待交易确认
                        await txResponse.wait();
                        this.logToFile(`USDT转账成功, nonce: ${nonce}`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: usdtAmount,
                            txHash: txResponse.hash,
                            nonce: nonce,
                            chainId: chainId
                        };

                    } catch (error) {
                        const errorMsg = `USDT转账失败 (${targetAddress}): ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: errorMsg,
                            nonce: startNonce + globalIndex,
                            chainId: chainId
                        };
                    }
                });

                // 并发执行当前批次的所有交易
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 短暂延迟避免RPC压力过大
                if (i + maxConcurrency < targetWallets.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 输出汇总结果
            this.logToFile("=== USDT转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalUsdtSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalUsdtSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalUsdtSent.toFixed(6)} USDT`, logFileName);
            this.logToFile(`使用的Chain ID: ${chainId}`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发USDT过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
    /**
     * 将指定地址中的USDT随机分配并转入到wallets.json中的每个地址（支持自定义decimals）
     * @param {string} sourcePrivateKey - 源地址私钥
     * @param {string} rpcUrl - RPC节点URL
     * @param {Object} options - 转账选项
     * @returns {Promise<Array>} 转账结果数组
     */
    async distributeUsdtFromSource4(sourcePrivateKey, rpcUrl, options = {}) {
        const logFileName = 'usdt_transfer.log';
        const {
            minAmount = 10,
            maxAmount = 100,
            usdtContractAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            maxConcurrency = 10,
            gasPriceMultiplier = 1.3,
            gasLimit = 100000,
            decimals = 6  // 添加decimals参数，默认为6（USDT标准）
        } = options;

        try {
            this.logToFile(`开始USDT分发任务 (decimals: ${decimals})`, logFileName);

            // 连接网络
            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
            const sourceAddress = await sourceWallet.getAddress();

            // 获取网络信息
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            const startNonce = await provider.getTransactionCount(sourceAddress, 'latest');

            this.logToFile(`源地址: ${sourceAddress}`, logFileName);
            this.logToFile(`Chain ID: ${chainId}`, logFileName);
            this.logToFile(`起始nonce: ${startNonce}`, logFileName);

            // USDT合约ABI
            const usdtAbi = [
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address, uint256) returns (bool)"
            ];

            // 获取USDT余额
            const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, provider);
            const usdtBalance = await usdtContract.balanceOf(sourceAddress);
            this.logToFile(`源地址USDT余额: ${ethers.utils.formatUnits(usdtBalance, decimals)} USDT`, logFileName);

            // 读取目标钱包
            const targetWallets = this.readAllWallets();
            if (targetWallets.length === 0) {
                const errorMsg = "未找到目标钱包";
                this.logToFile(errorMsg, logFileName);
                throw new Error(errorMsg);
            }

            this.logToFile(`准备向 ${targetWallets.length} 个地址转账USDT...`, logFileName);

            // 预先计算所有转账金额
            const transferAmounts = [];
            for (let i = 0; i < targetWallets.length; i++) {
                const usdtAmount = Math.random() * (maxAmount - minAmount) + minAmount;
                transferAmounts.push(usdtAmount);
            }

            // 使用nonce管理并发执行转账
            const results = [];

            // 分批处理以避免nonce冲突
            for (let i = 0; i < targetWallets.length; i += maxConcurrency) {
                const batch = targetWallets.slice(i, Math.min(i + maxConcurrency, targetWallets.length));
                this.logToFile(`处理批次: ${Math.floor(i / maxConcurrency) + 1}, 包含 ${batch.length} 个交易`, logFileName);

                // 为当前批次创建带nonce的交易
                const batchPromises = batch.map(async (targetWallet, indexInBatch) => {
                    const globalIndex = i + indexInBatch;
                    const targetAddress = targetWallet.address;
                    const usdtAmount = transferAmounts[globalIndex];

                    this.logToFile(`准备转账到: ${targetAddress}, 金额: ${usdtAmount.toFixed(decimals)} USDT`, logFileName);

                    try {
                        // 使用自定义decimals解析金额
                        const usdtValue = ethers.utils.parseUnits(usdtAmount.toFixed(decimals), decimals);
                        const nonce = startNonce + globalIndex;

                        // 检查USDT余额是否足够
                        const currentBalance = await usdtContract.balanceOf(sourceAddress);
                        if (currentBalance.lt(usdtValue)) {
                            const errorMsg = `USDT余额不足，跳过转账`;
                            this.logToFile(errorMsg, logFileName);
                            return {
                                targetAddress,
                                success: false,
                                amount: 0,
                                error: "USDT余额不足",
                                nonce: nonce,
                                chainId: chainId
                            };
                        }

                        // 构建USDT转账交易数据
                        const transferData = usdtContract.interface.encodeFunctionData("transfer", [
                            targetAddress,
                            usdtValue
                        ]);

                        // 构建交易对象，包含chainId字段
                        const tx = {
                            to: usdtContractAddress,
                            data: transferData,
                            gasLimit: gasLimit,
                            gasPrice: (await provider.getGasPrice()).mul(Math.floor(gasPriceMultiplier * 100)).div(100),
                            nonce: nonce,
                            chainId: chainId
                        };

                        // 签名并发送交易
                        const signedTx = await sourceWallet.signTransaction(tx);
                        const txResponse = await provider.sendTransaction(signedTx);

                        this.logToFile(`USDT转账已发送, nonce: ${nonce}, hash: ${txResponse.hash}`, logFileName);

                        // 等待交易确认
                        await txResponse.wait();
                        this.logToFile(`USDT转账成功, nonce: ${nonce}`, logFileName);

                        return {
                            targetAddress,
                            success: true,
                            amount: usdtAmount,
                            txHash: txResponse.hash,
                            nonce: nonce,
                            chainId: chainId
                        };

                    } catch (error) {
                        const errorMsg = `USDT转账失败 (${targetAddress}): ${error.message}`;
                        this.logToFile(errorMsg, logFileName);
                        return {
                            targetAddress,
                            success: false,
                            amount: 0,
                            error: errorMsg,
                            nonce: startNonce + globalIndex,
                            chainId: chainId
                        };
                    }
                });

                // 并发执行当前批次的所有交易
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                // 短暂延迟避免RPC压力过大
                if (i + maxConcurrency < targetWallets.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // 输出汇总结果
            this.logToFile("=== USDT转账汇总 ===", logFileName);
            let successfulTransfers = 0;
            let totalUsdtSent = 0;

            results.forEach(result => {
                if (result.success) {
                    successfulTransfers++;
                    totalUsdtSent += result.amount;
                }
            });

            this.logToFile(`成功转账: ${successfulTransfers}/${targetWallets.length}`, logFileName);
            this.logToFile(`总计发送: ${totalUsdtSent.toFixed(decimals)} USDT`, logFileName);
            this.logToFile(`使用的Chain ID: ${chainId}`, logFileName);
            this.logToFile(`使用的decimals: ${decimals}`, logFileName);

            return results;

        } catch (error) {
            const errorMsg = `分发USDT过程中出现错误: ${error.message}`;
            this.logToFile(errorMsg, logFileName);
            throw error;
        }
    }
}

/**
 * 主函数 - 测试所有功能
 */
async function main() {
    try {
        console.log('开始测试 WalletGenerator 的所有功能...\n');
        const rpcUrl = "https://polygon-rpc.com";
        // 创建钱包生成器实例
        const generator = new WalletGenerator('./eth_wallets');
        /*
        // 测试1: 生成单个钱包
        console.log('=== 测试1: 生成单个钱包 ===');
        // const singleWallet = generator.generateSingleWalletWithWarning();
        console.log('单个钱包生成完成\n');
        
        // 测试2: 批量生成钱包
        console.log('=== 测试2: 批量生成钱包 ===');
        const multipleWallets = generator.generateMultipleWallets(5);
        console.log('批量钱包生成完成\n');
        /*
        // 测试3: 读取所有钱包信息
        console.log('=== 测试3: 读取所有钱包信息 ===');
        const allWallets = generator.readAllWallets();
        console.log(`总共读取到 ${allWallets.length} 个钱包\n`);
        
        // 测试4: 根据地址查找特定钱包
        console.log('=== 测试4: 查找特定钱包 ===');
        if (allWallets.length > 0) {
            const firstWalletAddress = allWallets[0].address;
            const foundWallet = generator.findWalletByAddress(firstWalletAddress);
            console.log(`找到钱包: ${foundWallet ? foundWallet.address : '未找到'}\n`);
        }
        
        // 测试5: 生成钱包并保存到文件
        console.log('=== 测试5: 生成钱包并保存到文件 ===');
        const testWallet = generator.generateWallet();
        const savedFilePath = generator.saveWalletToFile(testWallet, 'wallets.json');
        console.log(`钱包已保存到: ${savedFilePath}\n`);
        
        console.log('所有功能测试完成！');
        */
        //    await generator.distributeEthFromSource("0xdcc51b10356bc14c2db30a672605bc887287bdfc3c6a0c1d2eb112272d07178b",rpcUrl,{ minAmount: 0.001, maxAmount: 0.01 });
        // 测试6: 分发ETH测试

        console.log('=== 测试6: 分发ETH测试 ===');
        await generator.distributeEthFromSource4(
            "0xdcc51b10356bc14c2db30a672605bc887287bdfc3c6a0c1d2eb112272d07178b",
            rpcUrl,
            {
                minAmount: 0.0000001, maxAmount: 0.000001,
                maxConcurrency: 5, decimals: 18
            }
        );
        console.log('ETH分发测试完成\n');

        // 测试7: 分发USDT测试
        console.log('=== 测试7: 分发USDT测试 ===');
        await generator.distributeUsdtFromSource4(
            "0xdcc51b10356bc14c2db30a672605bc887287bdfc3c6a0c1d2eb112272d07178b",
            rpcUrl,
            {
                minAmount: 0.00001, maxAmount: 0.00005,
                usdtContractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
                maxConcurrency: 5, decimals: 6
            }
        );
        console.log('USDT分发测试完成\n');

    } catch (error) {
        console.error('测试过程中出错:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

// 导出类供其他模块使用
module.exports = {
    WalletGenerator,
    main
};