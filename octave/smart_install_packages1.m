%% 安装所有微积分相关包
clear; clc;
fprintf('安装Octave微积分工具箱...\n\n');

% 包列表
calc_packages = {
    'symbolic',     '符号计算（核心）';
    'integrators',  '数值积分';
    'odepkg',       '微分方程';
    'linear-algebra','线性代数';
    'optim',        '优化（含梯度）';
};

for i = 1:size(calc_packages, 1)
    pkg_name = calc_packages{i, 1};
    pkg_desc = calc_packages{i, 2};

    fprintf('%d. %s - %s\n', i, pkg_name, pkg_desc);

    try
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
            fprintf('   ✓ 已安装\n');
        else
            fprintf('   安装中...');
            pkg('install', '-forge', pkg_name);
            fprintf('✓ 成功\n');
        end
    catch ME
        fprintf('   ✗ 失败: %s\n', ME.message);
    end
    fprintf('\n');
end

fprintf('安装完成！\n');
pkg('list');
