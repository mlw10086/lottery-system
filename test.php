<?php
echo "PHP测试页面\n";
echo "PHP版本: " . phpversion() . "\n";
echo "当前时间: " . date('Y-m-d H:i:s') . "\n";

// 测试JSON功能
$testData = ['test' => '测试数据', 'time' => time()];
echo "JSON测试: " . json_encode($testData, JSON_UNESCAPED_UNICODE) . "\n";

// 测试文件操作
$testFile = 'data/test.txt';
if (!file_exists('data')) {
    mkdir('data', 0755, true);
    echo "创建data目录成功\n";
}

file_put_contents($testFile, "测试文件写入\n");
if (file_exists($testFile)) {
    echo "文件写入测试成功\n";
    unlink($testFile);
} else {
    echo "文件写入测试失败\n";
}

echo "PHP环境测试完成！\n";
?>
