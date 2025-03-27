# 图片压缩工具 (imageOptimizer)

这是一个基于 Sharp 库的图片压缩脚本，用于将 PNG 图片转换为更高效的格式以减小文件大小。该工具提供了灵活的配置选项，支持自定义优化参数、路径排除以及增量优化。

## 特点

- 将 PNG 图像转换为高效的 JPEG/WebP 格式
- 自动保存优化记录，避免重复处理
- 仅当优化后的文件更小时才替换原文件
- 支持排除特定路径下的图片
- 支持自定义输出目录
- 详细的优化日志输出

## 安装依赖

```bash
npm install sharp glob
```

## 使用方法

### 引入模块

```typescript
import { optimizeImages } from './scripts/imageOptimizer';
```

### 基本用法

```typescript
// 使用默认配置优化
await optimizeImages();
```

### 自定义配置

```typescript
await optimizeImages({
  options: {
    quality: 80,           // 图像质量 (1-100)
    alphaQuality: 90,      // Alpha通道质量 (1-100)
    effort: 5,             // 压缩努力程度 (0-6)
    preset: 'text',        // 优化预设
  },
  sourcePath: 'path.resolve(__dirname, '../src')',      // 源文件路径
  outputPath: 'path.resolve(__dirname, '../output')',     // 输出路径 (可选，默认同sourcePath)
  excludePaths: [], // 需要排除的路径
});
```

## 配置选项

### OptimizeOptions 接口

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options` | `WebpOptions & { quality: number }` | `{ quality: 80 }` | Sharp图像处理选项 |
| `sourcePath` | `string` | `'src'` | 源文件目录 |
| `outputPath` | `string` | 同 `sourcePath` | 输出文件目录 |
| `excludePaths` | `string[]` | `[]` | 要排除的文件路径列表 |

### Sharp 质量选项

| 选项 | 说明 |
|------|------|
| `quality` | 图像质量，取值1-100，默认80 |
| `alphaQuality` | 透明度通道质量，取值1-100，默认100 |
| `effort` | CPU处理强度，取值0-6，0为最快，6为压缩率最高 |
| `preset` | 预设模式，可选：'default', 'photo', 'picture', 'drawing', 'icon', 'text' |

## 压缩记录

工具会在脚本目录生成 `.optimization-record.json` 文件，记录已优化的图像信息，包括：

- 文件路径
- 文件大小
- 最后优化时间
- 使用的质量设置

**这些记录用于跳过已经优化过的文件，提高构建效率。**

## 扩展与定制

脚本支持修改以支持其他图像格式和优化策略。要切换格式，只需修改 `optimizeImages` 函数中的转换部分：

```typescript
// 转为WebP (推荐用于网络图像且需要透明度)
await sharp(file)
  .webp({
    quality: options.quality,
    effort: 5
  })
  .toFile(tempFilePath);

// 或转为AVIF (更高压缩率但兼容性较低)
await sharp(file)
  .avif({
    quality: options.quality
  })
  .toFile(tempFilePath);
```
