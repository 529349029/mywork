%% simple_install.m - 简易一键安装
clear; clc;

fprintf('开始安装常用Octave工具箱...\n\n');

% 尝试从forge安装（最简方式）
pkgs = {'control', 'signal', 'image', 'statistics', 'io', 'optim'};

for i = 1:length(pkgs)
    pkg_name = pkgs{i};
    fprintf('正在安装: %s ...', pkg_name);

    try
        % 先尝试forge安装
        pkg install -forge pkg_name;
        fprintf('✓ 成功\n');
    catch
        try
            % 如果forge失败，尝试本地安装
            fprintf('forge失败，尝试本地安装...');
            % 这里可以添加本地文件路径
            fprintf('需要手动下载文件\n');
        catch
            fprintf('✗ 失败\n');
        end
    end
    pause(0.5);
end

fprintf('\n安装完成！\n');
pkg list
