import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';
import { WebpOptions } from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface OptimizeOptions {
    options?: WebpOptions & {
        quality: number;
    };
    sourcePath?: string;
    outputPath?: string;
    excludePaths?: string[]; // 新增属性
}

interface ImageRecord {
    path: string;
    size: number;
    lastOptimized: string;
    quality: number;
}

interface OptimizationRecord {
    images: Record<string, ImageRecord>;
}

const RECORD_FILE = path.join(__dirname, '.optimization-record.json');

async function loadOptimizationRecord(): Promise<OptimizationRecord> {
    if (existsSync(RECORD_FILE)) {
        const content = await fs.readFile(RECORD_FILE, 'utf-8');
        return JSON.parse(content);
    }
    return { images: {} };
}

async function saveOptimizationRecord(record: OptimizationRecord): Promise<void> {
    await fs.writeFile(RECORD_FILE, JSON.stringify(record, null, 2));
}

export async function optimizeImages({
    options = {
        quality: 80,
    },
    sourcePath = 'src',
    outputPath: _outputPath,
    excludePaths = [],
}: OptimizeOptions = {}) {
    try {
        const outputPath = _outputPath || sourcePath;
        const optimizationRecord = await loadOptimizationRecord();
        const files = await glob('**/*.png', {
            cwd: sourcePath,
            absolute: true,
        });

        console.log(`Found ${files.length} PNG files to optimize`);

        for (const file of files) {
            const relativePath = path.relative(sourcePath, file).split(path.sep).join('/');
            const normalizedPath = path.normalize(relativePath);

            // 检查是否在排除路径中
            if (excludePaths.some((excludePath) => normalizedPath.startsWith(path.normalize(excludePath)))) {
                console.log(`Skipped: ${normalizedPath} (excluded by configuration)`);
                continue;
            }

            const outputFilePath = path.join(outputPath, normalizedPath);
            const outputDir = path.dirname(outputFilePath);

            // 检查文件是否已经被优化过
            const originalStat = await fs.stat(file);
            const existingRecord = optimizationRecord.images[normalizedPath];

            if (existingRecord && existingRecord.size === originalStat.size) {
                console.log(`Skipped: ${normalizedPath} (already optimized with same size)`);
                continue;
            }

            // 创建临时文件路径
            const tempFilePath = `${outputFilePath}.temp`;

            // 使用 fs promises API
            await fs.mkdir(outputDir, { recursive: true });

            // 先输出到临时文件
            await sharp(file).webp(options).toFile(tempFilePath);

            // 获取压缩后的文件大小
            const optimizedStat = await fs.stat(tempFilePath);

            // 如果压缩成功且文件大小更小，则替换原文件
            if (optimizedStat.size < originalStat.size) {
                await fs.rename(tempFilePath, outputFilePath);
                const savings = (((originalStat.size - optimizedStat.size) / originalStat.size) * 100).toFixed(2);
                console.log(`Optimized: ${normalizedPath}`);
                console.log(`Size reduced: ${originalStat.size} -> ${optimizedStat.size} bytes (${savings}% saved)`);

                // 更新优化记录
                optimizationRecord.images[normalizedPath] = {
                    path: normalizedPath,
                    size: optimizedStat.size,
                    lastOptimized: new Date().toISOString(),
                    quality: options.quality,
                };
            } else {
                // 如果压缩后文件更大，则删除临时文件并保留原文件
                await fs.unlink(tempFilePath);
                console.log(`Skipped: ${relativePath} (optimization would increase file size)`);
            }
        }

        // 保存优化记录
        await saveOptimizationRecord(optimizationRecord);
        console.log('Image optimization completed successfully!');
    } catch (error) {
        console.error('Error optimizing images:', error);
        throw error; // 重新抛出错误以便调用者处理
    }
}

// 执行优化
const run = async () => {
    try {
        await optimizeImages({
            options: {
                quality: 92,
                alphaQuality: 90,
                effort: 5,
                preset: 'text',
            },
            sourcePath: 'C:\\Users\\Alec\\Downloads\\sharp',
            excludePaths: [],
        });
    } catch (error) {
        console.error('Optimization failed:', error);
        process.exit(1);
    }
};

run();
