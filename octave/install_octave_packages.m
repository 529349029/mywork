%% install_octave_packages.m - 一键安装Octave常用工具箱
clear all; close all; clc;

fprintf('==================================================\n');
fprintf('         Octave常用工具箱一键安装脚本\n');
fprintf('==================================================\n\n');

% 创建下载目录
download_dir = '~/octave_packages/';
if ~exist(download_dir, 'dir')
    mkdir(download_dir);
    fprintf('✓ 创建下载目录: %s\n', download_dir);
end

% 包列表 - 包含多个备用下载源
packages = {
    % 包名, 主下载URL, 备用URL1, 备用URL2
    'control', 'https://github.com/gnu-octave/pkg-control/releases/download/control-4.2.1/control-4.2.1.tar.gz', ...
               'https://gitlab.com/gnu-octave/pkg-control/-/archive/control-4.2.1/pkg-control-control-4.2.1.tar.gz', ...
               'https://sourceforge.net/projects/octave/files/Octave%20Forge%20Packages/control-4.2.1.tar.gz/download';

    'signal', 'https://github.com/gnu-octave/pkg-signal/releases/download/signal-1.4.3/signal-1.4.3.tar.gz', ...
              'https://gitlab.com/gnu-octave/pkg-signal/-/archive/signal-1.4.3/pkg-signal-signal-1.4.3.tar.gz', ...
              'https://sourceforge.net/projects/octave/files/Octave%20Forge%20Packages/signal-1.4.3.tar.gz/download';

    'image', 'https://github.com/gnu-octave/pkg-image/releases/download/image-2.16.1/image-2.16.1.tar.gz', ...
             'https://gitlab.com/gnu-octave/pkg-image/-/archive/image-2.16.1/pkg-image-image-2.16.1.tar.gz', ...
             'https://sourceforge.net/projects/octave/files/Octave%20Forge%20Packages/image-2.16.1.tar.gz/download';

    'statistics', 'https://github.com/gnu-octave/pkg-statistics/releases/download/statistics-1.4.3/statistics-1.4.3.tar.gz', ...
                  'https://gitlab.com/gnu-octave/pkg-statistics/-/archive/statistics-1.4.3/pkg-statistics-statistics-1.4.3.tar.gz', ...
                  'https://sourceforge.net/projects/octave/files/Octave%20Forge%20Packages/statistics-1.4.3.tar.gz/download';

    'io', 'https://github.com/gnu-octave/pkg-io/releases/download/io-2.6.4/io-2.6.4.tar.gz', ...
          'https://gitlab.com/gnu-octave/pkg-io/-/archive/io-2.6.4/pkg-io-io-2.6.4.tar.gz', ...
          'https://sourceforge.net/projects/octave/files/Octave%20Forge%20Packages/io-2.6.4.tar.gz/download';

    'optim', 'https://github.com/gnu-octave/pkg-optim/releases/download/optim-1.6.2/optim-1.6.2.tar.gz', ...
             'https://gitlab.com/gnu-octave/pkg-optim/-/archive/optim-1.6.2/pkg-optim-optim-1.6.2.tar.gz', ...
             'https://sourceforge.net/projects/octave/files/Octave%20Forge%20Packages/optim-1.6.2.tar.gz/download';
};

% 安装进度
success_count = 0;
total_packages = size(packages, 1);

fprintf('开始安装 %d 个常用工具箱...\n\n', total_packages);

for i = 1:total_packages
    pkg_name = packages{i, 1};
    urls = packages(i, 2:end);
    filename = [download_dir, pkg_name, '.tar.gz'];

    fprintf('【%d/%d】安装: %s\n', i, total_packages, pkg_name);

    try
        % 检查是否已安装
        pkg_list_output = evalc('pkg list');
        if contains(pkg_list_output, pkg_name)
            fprintf('  ✓ 已安装，跳过\n\n');
            success_count = success_count + 1;
            continue;
        end

        % 尝试从多个源下载
        downloaded = false;
        for url_idx = 1:length(urls)
            url = urls{url_idx};
            if ~isempty(url)
                try
                    fprintf('  尝试源 %d: %s\n', url_idx, url);

                    if ~exist(filename, 'file')
                        % 使用websave下载
                        websave(filename, url);
                        fprintf('  ✓ 下载成功\n');
                    else
                        fprintf('  ✓ 使用已下载的文件\n');
                    end

                    downloaded = true;
                    break;  % 下载成功，跳出循环

                catch ME
                    fprintf('  ✗ 源 %d 失败: %s\n', url_idx, ME.message);
                    delete(filename);  % 删除可能损坏的文件
                end
            end
        end

        if ~downloaded
            fprintf('  ⚠ 所有源都失败，尝试离线安装（如果文件存在）\n');
        end

        % 安装
        if exist(filename, 'file')
            fprintf('  安装中...');
            pkg install filename;
            fprintf('✓ 安装成功\n\n');
            success_count = success_count + 1;
        else
            fprintf('  ✗ 安装失败: 无法获取文件\n\n');
        end

    catch ME
        fprintf('  ✗ 安装失败: %s\n\n', ME.message);
    end

    % 短暂暂停，避免请求过快
    pause(1);
end

% 安装结果汇总
fprintf('==================================================\n');
fprintf('安装完成！\n');
fprintf('成功安装: %d/%d 个工具箱\n', success_count, total_packages);
fprintf('失败: %d 个\n', total_packages - success_count);
fprintf('==================================================\n\n');

% 列出所有已安装的包
fprintf('已安装的工具箱列表:\n');
pkg list

% 自动加载常用包
fprintf('\n正在自动加载常用包...\n');
try
    pkg load control
    pkg load signal
    pkg load image
    fprintf('✓ 常用包加载完成\n');
catch
    fprintf('⚠ 部分包加载失败，请手动加载\n');
end

% 显示使用示例
fprintf('\n==================================================\n');
fprintf('使用示例:\n');
fprintf('1. 加载control包: pkg load control\n');
fprintf('2. 创建传递函数: sys = tf([1], [1, 2, 1])\n');
fprintf('3. 绘制阶跃响应: step(sys)\n');
fprintf('==================================================\n');

% 保存安装记录
record_file = [download_dir, 'install_history.txt'];
fid = fopen(record_file, 'a');
fprintf(fid, '安装时间: %s\n', datestr(now));
fprintf(fid, '成功安装: %d/%d\n', success_count, total_packages);
fclose(fid);
fprintf('\n安装记录已保存到: %s\n', record_file);
