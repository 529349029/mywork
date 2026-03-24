%% 连续复利极限演示：lim(1+r/n)^n = e^r
clear all; close all; clc;

%% 参数设置
r = 0.1;                        % 年利率 10%
n = logspace(0, 6, 1000);       % 从1到1e6，对数均匀分布
e_power_r = exp(r);             % 连续复利精确值 e^r

%% 计算离散复利值
discrete_compound = (1 + r./n).^n;

%% 创建图形
figure('Position', [100, 100, 900, 600]);

% 主图：收敛过程
subplot(2, 2, [1, 2]);
semilogx(n, discrete_compound, 'b-', 'LineWidth', 2);
hold on;
yline(e_power_r, 'r--', 'LineWidth', 2);
hold off;

grid on;
xlabel('计息次数 n (对数坐标)', 'FontSize', 12);
ylabel('(1 + r/n)^n 值', 'FontSize', 12);
title(sprintf('极限收敛: $\\lim\\limits_{n \\to \\infty} (1 + %.2f/n)^n = e^{%.2f}$', r, r), ...
      'Interpreter', 'latex', 'FontSize', 14);
legend('离散复利 (1+r/n)^n', ...
       sprintf('连续复利 e^{%.2f} = %.6f', r, e_power_r), ...
       'Location', 'southeast');

% 子图1：误差分析
subplot(2, 2, 3);
error = abs(discrete_compound - e_power_r);
loglog(n, error, 'r-', 'LineWidth', 2);
grid on;
xlabel('计息次数 n', 'FontSize', 10);
ylabel('绝对误差 |(1+r/n)^n - e^r|', 'FontSize', 10);
title('误差衰减分析', 'FontSize', 12);

% 子图2：不同n值的详细表格
subplot(2, 2, 4);
axis off;

% 选择几个关键的n值显示
n_display = [1, 2, 4, 12, 52, 365, 1000, 10000, 100000];
text_str = {'\fontsize{10}\bf不同计息频率下的值对比:'};
text_str{end+1} = sprintf('\n\\fontsize{9}年利率 r = %.2f (%.1f%%)', r, r*100);
text_str{end+1} = sprintf('\n\\fontsize{9}连续复利: e^{%.2f} = %.8f', r, e_power_r);
text_str{end+1} = '\n';
text_str{end+1} = '\fontsize{9}\bfn\t\t(1+r/n)^n\t\t误差';

for i = 1:length(n_display)
    n_val = n_display(i);
    discrete_val = (1 + r/n_val)^n_val;
    error_val = abs(discrete_val - e_power_r);
    
    if n_val < 100
        text_str{end+1} = sprintf('\n\\fontsize{9}%d\t\t%.8f\t%.2e', ...
                                   n_val, discrete_val, error_val);
    else
        text_str{end+1} = sprintf('\n\\fontsize{9}%d\t%.8f\t%.2e', ...
                                   n_val, discrete_val, error_val);
    end
end

% 添加重要结论
text_str{end+1} = '\n';
text_str{end+1} = '\fontsize{9}\bf重要结论:';
text_str{end+1} = '\n\fontsize{8}1. n越大，离散复利越接近连续复利';
text_str{end+1} = '\n\fontsize{8}2. 年复利(n=1)误差最大: 0.47%';
text_str{end+1} = '\n\fontsize{8}3. 日复利(n=365)误差: 0.0014%';
text_str{end+1} = '\n\fontsize{8}4. 当n→∞时，两者相等';

text(0.1, 0.5, text_str, 'VerticalAlignment', 'middle', ...
     'HorizontalAlignment', 'left', 'Interpreter', 'tex');

%% 输出数值结果到命令窗口
fprintf('=============================================\n');
fprintf('        连续复利极限演示结果\n');
fprintf('=============================================\n\n');
fprintf('年利率 r = %.2f (%.1f%%)\n', r, r*100);
fprintf('连续复利精确值: e^r = %.8f\n\n', e_power_r);
fprintf('%10s %15s %15s %15s\n', 'n', '(1+r/n)^n', 'e^r', '相对误差(%)');
fprintf('%s\n', repmat('-', 60, 1));

for i = 1:length(n_display)
    n_val = n_display(i);
    discrete_val = (1 + r/n_val)^n_val;
    rel_error = 100 * abs(discrete_val - e_power_r) / e_power_r;
    
    fprintf('%10d %15.8f %15.8f %15.6f\n', ...
            n_val, discrete_val, e_power_r, rel_error);
end

%% 多利率对比图
figure('Position', [200, 200, 800, 500]);
rates = [0.05, 0.1, 0.2, 0.5];  % 不同利率
colors = {'b-', 'r-', 'g-', 'm-'};
labels = {};

hold on;
for i = 1:length(rates)
    r_current = rates(i);
    values = (1 + r_current./n).^n;
    semilogx(n, values, colors{i}, 'LineWidth', 2);
    labels{i} = sprintf('r=%.2f, e^{%.2f}=%.4f', ...
                        r_current, r_current, exp(r_current));
end
hold off;

grid on;
xlabel('计息次数 n (对数坐标)', 'FontSize', 12);
ylabel('(1 + r/n)^n 值', 'FontSize', 12);
title('不同利率下的收敛过程', 'FontSize', 14);
legend(labels, 'Location', 'southeast', 'FontSize', 10);

%% 数学推导展示
fprintf('\n\n=============================================\n');
fprintf('        数学推导\n');
fprintf('=============================================\n\n');

fprintf('1. 离散复利公式: (1 + r/n)^n\n');
fprintf('2. 取自然对数: n * ln(1 + r/n)\n');
fprintf('3. 当n→∞时，r/n→0，使用泰勒展开:\n');
fprintf('   ln(1 + x) = x - x²/2 + x³/3 - ... (x=r/n)\n');
fprintf('4. 因此: n * [r/n - (r/n)²/2 + (r/n)³/3 - ...]\n');
fprintf('        = r - r²/(2n) + r³/(3n²) - ...\n');
fprintf('5. 当n→∞时，高阶项消失: → r\n');
fprintf('6. 所以: (1 + r/n)^n = exp(n * ln(1 + r/n)) → exp(r)\n\n');

% 验证数学等价性
fprintf('数学等价性验证 (r=%.2f, n=1000):\n', r);
n_test = 1000;
x = r/n_test;
fprintf('a) 直接计算: (1+%.4f)^%d = %.8f\n', x, n_test, (1+x)^n_test);
fprintf('b) 取对数法: exp(%d*ln(1+%.6f)) = %.8f\n', n_test, x, exp(n_test*log(1+x)));
fprintf('c) 泰勒展开: exp(%.4f - %.4f^2/(2*%d)) = %.8f\n', r, r, n_test, exp(r - r^2/(2*n_test)));
fprintf('d) 精确值: e^%.2f = %.8f\n', r, exp(r));