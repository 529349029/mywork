% 中科大镜像地址（国内超快）
base = "https://mirrors.ustc.edu.cn/octave/packages/";

% 你需要的所有常用工具箱（含极限计算）
pkgs = {
    [base, "general-2.1.4.tar.gz"]
    [base, "struct-1.0.18.tar.gz"]
    [base, "io-2.6.4.tar.gz"]
    [base, "statistics-1.6.5.tar.gz"]
    [base, "optim-1.6.2.tar.gz"]
    [base, "control-4.2.1.tar.gz"]
    [base, "signal-1.4.5.tar.gz"]
    [base, "image-2.14.0.tar.gz"]
    [base, "linear-algebra-2.9.4.tar.gz"]
    [base, "miscellaneous-1.2.1.tar.gz"]
    [base, "symbolic-3.2.2.tar.gz"]   % 极限/微分必备
    [base, "string-1.2.1.tar.gz"]
};

% 自动批量安装
for i = 1:length(pkgs)
    fprintf("正在安装：%s\n", pkgs{i});
    pkg install(pkgs{i});
end

% 安装完自动加载所有包
pkg load all
