%% 实际可安装的微积分相关包
clear; clc;
fprintf('安装Octave微积分工具...\n\n');

% 可用的包列表
available_packages = {
    'symbolic',     '符号计算（核心）';      % ✓ 可用
    'linear-algebra','线性代数工具';         % ✓ 可用
    'optim',        '优化工具（含梯度）';     % ✓ 可用
    'struct',       '结构体工具';           % ✓ 可用
    'signal',       '信号处理（含数值方法）'; % ✓ 可用
};

for i = 1:size(available_packages, 1)
    pkg_name = available_packages{i, 1};
    pkg_desc = available_packages{i, 2};

    fprintf('%d. %s - %s\n', i, pkg_name, pkg_desc);

    try
        fprintf('   检查中...');
        % 检查是否已安装
        pkgs = pkg('list');
        installed = false;
        for j = 1:length(pkgs)
            if strcmp(pkgs{j}.name, pkg_name)
                installed = true;
                break;
            end
        end

        if installed
            fprintf('已安装 ✓\n');
        else
            fprintf('安装中...');
            pkg('install', '-forge', pkg_name);
            fprintf('成功 ✓\n');
        end
    catch ME
        fprintf('失败 ✗ (%s)\n', ME.message);
    end
    fprintf('\n');
end

fprintf('安装完成！\n');
