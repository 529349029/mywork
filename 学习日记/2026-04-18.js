function _callOptionalReturn(address token, bytes memory data) private {
    bytes memory returndata;
    bool success;
    bool decodedResult; // 1. 声明一个变量来接收汇编的结果

    assembly {
        // 执行调用
        success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0)
        
        // 处理调用失败
        if iszero(success) {
            returndatacopy(0, 0, returndatasize())
            revert(0, returndatasize())
        }

        // 处理返回值
        let size := returndatasize()
        
        // 如果有返回值
        if gt(size, 0) {
            // 分配内存并复制数据（为了让 Solidity 能读取 returndata 变量）
            returndata := mload(0x40)
            returndatacopy(returndata, 0, size)
            mstore(0x40, add(returndata, 0x20))

            // 2. 严格检查：数值必须 <= 1
            let result := mload(returndata)
            if gt(result, 1) {
                // 这里无法直接 throw Solidity 的自定义错误，只能 revert(0,0) 或者 revert 一个字符串
                // 为了省 Gas，通常这里直接 revert(0,0) 也是可以接受的，
                // 因为“返回非 bool 数据”本身就是一种极罕见的恶意行为。
                revert(0, 0) 
            }
            
            // 3. 直接把汇编里的结果赋值给 Solidity 变量
            // 此时 result 只能是 0 或 1，直接赋值即可
            decodedResult := result
        }
    }

    // 4. 如果长度不为 0，直接检查变量，不再需要 abi.decode
    if (returndata.length != 0) {
        require(decodedResult, Errors.SAFE_ERC20_CALL_FAILED);
    }
}



function _callOptionalReturn(address token, bytes memory data) private {
    bytes memory returndata;
    bool success;

    assembly {
        // 1. 执行底层调用
        // mload(0x40) 是获取空闲内存指针
        // add(data, 0x20) 跳过长度字段，指向实际数据
        success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0)
        
        // 2. 获取返回数据大小
        let size := returndatasize()
        
        // 3. 如果调用失败，直接回滚并传递错误信息
        if iszero(success) {
            returndatacopy(0, 0, size)
            revert(0, size)
        }
        
        // 4. 核心修复：处理返回值
        // 如果有返回值
        if gt(size, 0) {
            // 分配内存存放返回数据
            returndata := mload(0x40)
            // 复制数据
            returndatacopy(returndata, 0, size)
            // 更新空闲内存指针
            mstore(0x40, add(returndata, 0x20))
            
            // 5. 严格检查：
            // 如果长度不是32字节，或者数值大于1，则报错
            if or(iszero(eq(size, 32)), gt(mload(returndata), 1)) {
                revert(0, 0) // 或者 revert 一个具体的错误字符串
            }
        }
    }

    // 6. 此时，如果 returndata 长度不为 0，它一定是合法的 bool (0 或 1)
    // 我们只需要判断它是否为 false (0)
    if (returndata.length != 0) {
        require(abi.decode(returndata, (bool)), Errors.SAFE_ERC20_CALL_FAILED);
    }
}