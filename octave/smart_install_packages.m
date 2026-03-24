%% smart_install_packages_fixed.m - 修复版智能安装
clear all; close all; clc;

fprintf('================================================\n');
fprintf('    Octave工具箱智能安装器（修复版）\n');
fprintf('================================================\n\n');

% 正确的pkg调用方式检查
fprintf('检查当前安装状态...\n');
try
    % 正确的pkg list调用
    pkg('list');
    fprintf('✓ pkg命令正常\n');
catch ME
    fprintf('⚠ pkg命令错误: %s\n', ME.message);
    return;
end

% 创建必要的目录
download_dir = '~/octave_packages/';
if ~exist(download_dir, 'dir')
    mkdir(download_dir);
    fprintf('创建下载目录: %s\n', download_dir);
end

% 核心包列表
essential_packages = {
    'control',   '控制工具箱';
    'signal',    '信号处理';
    'image',     '图像处理';
    'statistics','统计分析';
    'io',        '数据输入输出';
};

fprintf('\n开始安装 %d 个核心工具箱...\n\n', size(essential_packages, 1));

success_count = 0;
skip_count = 0;
fail_count = 0;

% 主安装循环 - 使用正确的pkg调用语法
for i = 1:size(essential_packages, 1)
    pkg_name = essential_packages{i, 1};
    pkg_desc = essential_packages{i, 2};

    fprintf('%d. %s (%s)\n', i, pkg_name, pkg_desc);

    % 检查是否已安装
    try
        pkg_info = pkg('list');
        is_installed = false;
        for j = 1:length(pkg_info)
            if strcmp(pkg_info{j}.name, pkg_name)
                is_installed = true;
                break;
            end
        end

        if is_installed
            fprintf('  ✓ 已安装，跳过\n\n');
            success_count = success_count + 1;
            skip_count = skip_count + 1;
            continue;
        end
    catch
        % 忽略检查错误
    end

    % 尝试安装
    try
        fprintf('  安装中...');
        % 正确的pkg install调用
        pkg('install', '-forge', pkg_name);
        fprintf('成功\n\n');
        success_count = success_count + 1;
    catch ME
        fprintf('失败: %s\n\n', ME.message);
        fail_count = fail_count + 1;
    end

    % 短暂暂停
    pause(0.5);
end

% 结果汇总
fprintf('================================================\n');
fprintf('安装完成！\n');
fprintf('成功安装: %d 个\n', success_count);
fprintf('已存在跳过: %d 个\n', skip_count);
fprintf('安装失败: %d 个\n', fail_count);
fprintf('================================================\n\n');

% 显示已安装列表
fprintf('已安装的工具箱:\n');
try
    pkg('list');
catch
    fprintf('(无法列出包列表)\n');
end
