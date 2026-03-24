%% 完整的Octave微积分解决方案
function octave_calculus_suite()
    fprintf('Octave微积分套件\n');
    fprintf('================\n\n');

    % 1. 安装symbolic包（如果可用）
    try
        pkgs = pkg('list');
        has_symbolic = false;
        for i = 1:length(pkgs)
            if strcmp(pkgs{i}.name, 'symbolic')
                has_symbolic = true;
                break;
            end
        end

        if ~has_symbolic
            fprintf('安装symbolic包（符号计算）...');
            pkg('install', '-forge', 'symbolic');
            fprintf('✓\n');
        else
            fprintf('symbolic包已安装 ✓\n');
        end
    catch
        fprintf('symbolic包安装失败，将使用数值方法 ✗\n');
    end

    % 2. 演示功能
    fprintf('\n可用功能演示:\n');
    fprintf('----------------------------------------\n');

    % 数值积分演示
    fprintf('A. 数值积分:\n');
    demo_numerical_integration();

    % 微分方程演示
    fprintf('\nB. 微分方程求解:\n');
    demo_ode();

    % 符号计算（如果已安装）
    try
        pkg load symbolic
        fprintf('\nC. 符号计算:\n');
        demo_symbolic();
    catch
        fprintf('\nC. 符号计算: 未安装symbolic包\n');
    end
end

function demo_numerical_integration()
    % 数值积分示例
    f = @(x) sin(x)./x;  % sinc函数

    % 避免x=0的奇点
    result1 = quadgk(f, 0.001, 10);
    result2 = integral(f, 0.001, 10);

    fprintf('   1. ∫₀^¹⁰ sin(x)/x dx ≈ %.6f (quadgk)\n', result1);
    fprintf('   2. ∫₀^¹⁰ sin(x)/x dx ≈ %.6f (integral)\n', result2);

    % 多重积分示例
    f2 = @(x,y) exp(-(x.^2 + y.^2));
    result3 = integral2(f2, -2, 2, -2, 2);
    fprintf('   3. 二重积分: ∫∫ e^(-x²-y²) dxdy ≈ %.6f\n', result3);
end

function demo_ode()
    % 微分方程示例

    % 1. 一阶ODE
    odefun1 = @(t,y) -0.5*y;
    [t1, y1] = ode45(odefun1, [0, 10], 1);
    fprintf('   1. dy/dt = -0.5y, y(0)=1\n');
    fprintf('      y(10) = %.6f\n', y1(end));

    % 2. 二阶ODE（弹簧-质量系统）
    % m*x'' + c*x' + k*x = 0
    m = 1; c = 0.1; k = 1;
    odefun2 = @(t, x) [x(2); (-c*x(2) - k*x(1))/m];
    [t2, x2] = ode45(odefun2, [0, 20], [1; 0]);  % 初始位移=1，速度=0
    fprintf('   2. 阻尼振动: x(20) = %.6f\n', x2(end,1));
end

function demo_symbolic()
    % 符号计算示例
    pkg load symbolic

    syms x
    % 微分
    f = sin(x)*exp(-x);
    df = diff(f, x);
    fprintf('   1. 微分: d/dx[sin(x)e^{-x}] = %s\n', char(df));

    % 积分
    F = int(f, x);
    fprintf('   2. 积分: ∫sin(x)e^{-x}dx = %s + C\n', char(F));

    % 定积分
    F_def = int(f, x, 0, pi);
    fprintf('   3. 定积分: ∫₀^π sin(x)e^{-x}dx = %s\n', char(F_def));
end

% 运行套件
octave_calculus_suite();
