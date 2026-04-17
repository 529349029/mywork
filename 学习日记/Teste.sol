pragma solidity ^0.7.0;

contract Teste {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    uint256 public a = 1;

    receive() external payable {
        a++;
    }

    function b() public view returns (uint256) {
        return address(this).balance;
    }

    function rescueWrongTokens(address payable _recipient) public {
        require(msg.sender == owner);
        _recipient.transfer(address(this).balance);
    }
}

contract Teste1 {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function a(address payable recipient, uint256 amount) public payable {
        recipient.call{value: amount}("");
    }
    //这个地方的recipient只能是钱包地址吗？能不能是合约地址呢？
    function b(address payable recipient, uint256 amount) public payable {
        recipient.transfer(address(this).balance);
    }

    function c() public view returns (uint256) {
        return address(this).balance;
    }
    //这里的recipient不能是合约地址
    function rescueWrongTokens(address payable _recipient) public {
        require(msg.sender == owner);
        _recipient.transfer(address(this).balance);
    }
    receive() external payable {
    }
}
//Teste1: 0xB489c650EFce79B66cd0165191b91cb74C00b0f3
//Teste: 0xDECB7c3D585C7a7CA9C9A4613b863B332a0957d2