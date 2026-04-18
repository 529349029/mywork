/**
 *Submitted for verification at BscScan.com on 2021-11-21
https://bscscan.com/address/0xc7897FB5D15eD5eD5D631Ef261Aacf9D6C0a9774
 */
pragma solidity >=0.6.0 <0.7.0;

library EnumerableSet {
  // To implement this library for multiple types with as little code
  // repetition as possible, we write it in terms of a generic Set type with
  // bytes32 values.
  // The Set implementation uses private functions, and user-facing
  // implementations (such as AddressSet) are just wrappers around the
  // underlying Set.
  // This means that we can only create new EnumerableSets for types that fit
  // in bytes32.

  struct Set {
    // Storage of set values
    bytes32[] _values;
    // Position of the value in the `values` array, plus 1 because index 0
    // means a value is not in the set.
    mapping(bytes32 => uint256) _indexes;
  }

  /**
   * @dev Add a value to a set. O(1).
   *
   * Returns true if the value was added to the set, that is if it was not
   * already present.
   */
  function _add(Set storage set, bytes32 value) private returns (bool) {
    if (!_contains(set, value)) {
      set._values.push(value);
      // The value is stored at length-1, but we add 1 to all indexes
      // and use 0 as a sentinel value
      set._indexes[value] = set._values.length;
      return true;
    } else {
      return false;
    }
  }

  /**
   * @dev Removes a value from a set. O(1).
   *
   * Returns true if the value was removed from the set, that is if it was
   * present.
   */
  function _remove(Set storage set, bytes32 value) private returns (bool) {
    // We read and store the value's index to prevent multiple reads from the same storage slot
    uint256 valueIndex = set._indexes[value];

    if (valueIndex != 0) {
      // Equivalent to contains(set, value)
      // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
      // the array, and then remove the last element (sometimes called as 'swap and pop').
      // This modifies the order of the array, as noted in {at}.

      uint256 toDeleteIndex = valueIndex - 1;
      uint256 lastIndex = set._values.length - 1;

      // When the value to delete is the last one, the swap operation is unnecessary. However, since this occurs
      // so rarely, we still do the swap anyway to avoid the gas cost of adding an 'if' statement.

      bytes32 lastvalue = set._values[lastIndex];

      // Move the last value to the index where the value to delete is
      set._values[toDeleteIndex] = lastvalue;
      // Update the index for the moved value
      set._indexes[lastvalue] = toDeleteIndex + 1; // All indexes are 1-based

      // Delete the slot where the moved value was stored
      set._values.pop();

      // Delete the index for the deleted slot
      delete set._indexes[value];

      return true;
    } else {
      return false;
    }
  }

  /**
   * @dev Returns true if the value is in the set. O(1).
   */
  function _contains(Set storage set, bytes32 value)
    private
    view
    returns (bool)
  {
    return set._indexes[value] != 0;
  }

  /**
   * @dev Returns the number of values on the set. O(1).
   */
  function _length(Set storage set) private view returns (uint256) {
    return set._values.length;
  }

  /**
   * @dev Returns the value stored at position `index` in the set. O(1).
   *
   * Note that there are no guarantees on the ordering of values inside the
   * array, and it may change when more values are added or removed.
   *
   * Requirements:
   *
   * - `index` must be strictly less than {length}.
   */
  function _at(Set storage set, uint256 index) private view returns (bytes32) {
    require(set._values.length > index, "EnumerableSet: index out of bounds");
    return set._values[index];
  }

  // Bytes32Set

  struct Bytes32Set {
    Set _inner;
  }

  /**
   * @dev Add a value to a set. O(1).
   *
   * Returns true if the value was added to the set, that is if it was not
   * already present.
   */
  function add(Bytes32Set storage set, bytes32 value) internal returns (bool) {
    return _add(set._inner, value);
  }

  /**
   * @dev Removes a value from a set. O(1).
   *
   * Returns true if the value was removed from the set, that is if it was
   * present.
   */
  function remove(Bytes32Set storage set, bytes32 value)
    internal
    returns (bool)
  {
    return _remove(set._inner, value);
  }

  /**
   * @dev Returns true if the value is in the set. O(1).
   */
  function contains(Bytes32Set storage set, bytes32 value)
    internal
    view
    returns (bool)
  {
    return _contains(set._inner, value);
  }

  /**
   * @dev Returns the number of values in the set. O(1).
   */
  function length(Bytes32Set storage set) internal view returns (uint256) {
    return _length(set._inner);
  }

  /**
   * @dev Returns the value stored at position `index` in the set. O(1).
   *
   * Note that there are no guarantees on the ordering of values inside the
   * array, and it may change when more values are added or removed.
   *
   * Requirements:
   *
   * - `index` must be strictly less than {length}.
   */
  function at(Bytes32Set storage set, uint256 index)
    internal
    view
    returns (bytes32)
  {
    return _at(set._inner, index);
  }

  // AddressSet

  struct AddressSet {
    Set _inner;
  }

  /**
   * @dev Add a value to a set. O(1).
   *
   * Returns true if the value was added to the set, that is if it was not
   * already present.
   */
  function add(AddressSet storage set, address value) internal returns (bool) {
    return _add(set._inner, bytes32(uint256(uint160(value))));
  }

  /**
   * @dev Removes a value from a set. O(1).
   *
   * Returns true if the value was removed from the set, that is if it was
   * present.
   */
  function remove(AddressSet storage set, address value)
    internal
    returns (bool)
  {
    return _remove(set._inner, bytes32(uint256(uint160(value))));
  }

  /**
   * @dev Returns true if the value is in the set. O(1).
   */
  function contains(AddressSet storage set, address value)
    internal
    view
    returns (bool)
  {
    return _contains(set._inner, bytes32(uint256(uint160(value))));
  }

  /**
   * @dev Returns the number of values in the set. O(1).
   */
  function length(AddressSet storage set) internal view returns (uint256) {
    return _length(set._inner);
  }

  /**
   * @dev Returns the value stored at position `index` in the set. O(1).
   *
   * Note that there are no guarantees on the ordering of values inside the
   * array, and it may change when more values are added or removed.
   *
   * Requirements:
   *
   * - `index` must be strictly less than {length}.
   */
  function at(AddressSet storage set, uint256 index)
    internal
    view
    returns (address)
  {
    return address(uint160(uint256(_at(set._inner, index))));
  }

  // UintSet

  struct UintSet {
    Set _inner;
  }

  /**
   * @dev Add a value to a set. O(1).
   *
   * Returns true if the value was added to the set, that is if it was not
   * already present.
   */
  function add(UintSet storage set, uint256 value) internal returns (bool) {
    return _add(set._inner, bytes32(value));
  }

  /**
   * @dev Removes a value from a set. O(1).
   *
   * Returns true if the value was removed from the set, that is if it was
   * present.
   */
  function remove(UintSet storage set, uint256 value) internal returns (bool) {
    return _remove(set._inner, bytes32(value));
  }

  /**
   * @dev Returns true if the value is in the set. O(1).
   */
  function contains(UintSet storage set, uint256 value)
    internal
    view
    returns (bool)
  {
    return _contains(set._inner, bytes32(value));
  }

  /**
   * @dev Returns the number of values on the set. O(1).
   */
  function length(UintSet storage set) internal view returns (uint256) {
    return _length(set._inner);
  }

  /**
   * @dev Returns the value stored at position `index` in the set. O(1).
   *
   * Note that there are no guarantees on the ordering of values inside the
   * array, and it may change when more values are added or removed.
   *
   * Requirements:
   *
   * - `index` must be strictly less than {length}.
   */
  function at(UintSet storage set, uint256 index)
    internal
    view
    returns (uint256)
  {
    return uint256(_at(set._inner, index));
  }
}

library SafeMath {
  /**
   * @dev Returns the addition of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `+` operator.
   *
   * Requirements:
   * - Addition cannot overflow.
   */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a, "SafeMath: addition overflow");

    return c;
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting on
   * overflow (when the result is negative).
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   * - Subtraction cannot overflow.
   */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    return sub(a, b, "SafeMath: subtraction overflow");
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
   * overflow (when the result is negative).
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   * - Subtraction cannot overflow.
   */
  function sub(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b <= a, errorMessage);
    uint256 c = a - b;

    return c;
  }

  /**
   * @dev Returns the multiplication of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `*` operator.
   *
   * Requirements:
   * - Multiplication cannot overflow.
   */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b, "SafeMath: multiplication overflow");

    return c;
  }

  /**
   * @dev Returns the integer division of two unsigned integers. Reverts on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator. Note: this function uses a
   * `revert` opcode (which leaves remaining gas untouched) while Solidity
   * uses an invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   * - The divisor cannot be zero.
   */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    return div(a, b, "SafeMath: division by zero");
  }

  /**
   * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator. Note: this function uses a
   * `revert` opcode (which leaves remaining gas untouched) while Solidity
   * uses an invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   * - The divisor cannot be zero.
   */
  function div(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    // Solidity only automatically asserts when dividing by 0
    require(b > 0, errorMessage);
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * Reverts when dividing by zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   * - The divisor cannot be zero.
   */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    return mod(a, b, "SafeMath: modulo by zero");
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * Reverts with custom message when dividing by zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   * - The divisor cannot be zero.
   */
  function mod(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b != 0, errorMessage);
    return a % b;
  }
}

contract Context {
  // Empty internal constructor, to prevent people from mistakenly deploying
  // an instance of this contract, which should be used via inheritance.
  constructor() internal {}

  function _msgSender() internal view returns (address payable) {
    return msg.sender;
  }

  function _msgData() internal view returns (bytes memory) {
    this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
    return msg.data;
  }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
  address private _owner;

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev Initializes the contract setting the deployer as the initial owner.
   */
  constructor() internal {
    address msgSender = _msgSender();
    _owner = msgSender;
    emit OwnershipTransferred(address(0), msgSender);
  }

  /**
   * @dev Returns the address of the current owner.
   */
  function owner() public view returns (address) {
    return _owner;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(_owner == _msgSender(), "Ownable: caller is not the owner");
    _;
  }

  /**
   * @dev Transfers ownership of the contract to a new account (`newOwner`).
   * Can only be called by the current owner.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    _transferOwnership(newOwner);
  }

  /**
   * @dev Transfers ownership of the contract to a new account (`newOwner`).
   */
  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0), "Ownable: new owner is the zero address");
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}

interface IERC20 {
  /**
   * @dev Returns the amount of tokens in existence.
   */
  function totalSupply() external view returns (uint256);

  /**
   * @dev Returns the amount of tokens owned by `account`.
   */
  function balanceOf(address account) external view returns (uint256);

  /**
   * @dev Moves `amount` tokens from the caller's account to `recipient`.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event.
   */
  function transfer(address recipient, uint256 amount) external returns (bool);

  /**
   * @dev Returns the remaining number of tokens that `spender` will be
   * allowed to spend on behalf of `owner` through {transferFrom}. This is
   * zero by default.
   *
   * This value changes when {approve} or {transferFrom} are called.
   */
  function allowance(address owner, address spender)
    external
    view
    returns (uint256);

  /**
   * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * IMPORTANT: Beware that changing an allowance with this method brings the risk
   * that someone may use both the old and the new allowance by unfortunate
   * transaction ordering. One possible solution to mitigate this race
   * condition is to first reduce the spender's allowance to 0 and set the
   * desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   *
   * Emits an {Approval} event.
   */
  function approve(address spender, uint256 amount) external returns (bool);

  /**
   * @dev Moves `amount` tokens from `sender` to `recipient` using the
   * allowance mechanism. `amount` is then deducted from the caller's
   * allowance.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event.
   */
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool);

  /**
   * @dev Emitted when `value` tokens are moved from one account (`from`) to
   * another (`to`).
   *
   * Note that `value` may be zero.
   */
  event Transfer(address indexed from, address indexed to, uint256 value);

  /**
   * @dev Emitted when the allowance of a `spender` for an `owner` is set by
   * a call to {approve}. `value` is the new allowance.
   */
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ReentrancyGuard {
  // Booleans are more expensive than uint256 or any type that takes up a full
  // word because each write operation emits an extra SLOAD to first read the
  // slot's contents, replace the bits taken up by the boolean, and then write
  // back. This is the compiler's defense against contract upgrades and
  // pointer aliasing, and it cannot be disabled.

  // The values being non-zero value makes deployment a bit more expensive,
  // but in exchange the refund on every call to nonReentrant will be lower in
  // amount. Since refunds are capped to a percentage of the total
  // transaction's gas, it is best to keep them low in cases like this one, to
  // increase the likelihood of the full refund coming into effect.
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;

  uint256 private _status;

  constructor() internal {
    _status = _NOT_ENTERED;
  }

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and make it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    // On the first call to nonReentrant, _notEntered will be true
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    // Any calls to nonReentrant after this point will fail
    _status = _ENTERED;

    _;

    // By storing the original value once again, a refund is triggered (see
    // https://eips.ethereum.org/EIPS/eip-2200)
    _status = _NOT_ENTERED;
  }
}

contract Whitelist is Ownable {
  mapping(address => bool) public _whitelist;

  event Whitelisted(address indexed _address, bool whitelist);
  event EnableWhitelist();
  event DisableWhitelist();

  modifier onlyWhitelisted {
    require(
      _whitelist[msg.sender],
      "Whitelist: caller is not on the whitelist"
    );
    _;
  }

  function isWhitelist(address _address) public view returns (bool) {
    return _whitelist[_address];
  }

  function setWhitelist(address _address, bool _on) external onlyOwner {
    _whitelist[_address] = _on;

    emit Whitelisted(_address, _on);
  }
}

interface IPancakeRouter {
  function WETH() external pure returns (address);

  function factory() external pure returns (address);

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);
}

interface IPancakePair {
  function getReserves()
    external
    view
    returns (
      uint112 reserve0,
      uint112 reserve1,
      uint32 blockTimestampLast
    );
}

interface IPancakeFactory {
  function getPair(address tokenA, address tokenB)
    external
    view
    returns (address pair);
}

contract BEP20Locker9 is ReentrancyGuard, Whitelist {
  using SafeMath for uint256;
  using EnumerableSet for EnumerableSet.AddressSet;
  uint256 public _10Years = 10 * 365 * 24 * 60 * 60;
  mapping(address => uint256) public lockTime;
  mapping(address => uint256) public lockprice;
  
  EnumerableSet.AddressSet private _tokens;
  address public router = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
  address public usdt = 0x55d398326f99059fF775485246999027B3197955;
  address public wbnb = IPancakeRouter(router).WETH();

  constructor() public {
    address addr0=0x03Ce650542Ac6d9510faF90907Ba22FF1Fd50995;
    address addr1=0xD2E6741C7E761eE58468A4136e96d5b6584b7577;
    address addr2=0x6B3e753dC2A7bd530f7ee1f9832d102F837DF278;
    address addr3=0xc97CC155A4ef7290A58fBc9072420191d76D13D4;
    address addr4=0x1b4b2f4bD3538C7b4Fea4f6F5f2870E60Ce7AFcA;
    _whitelist[msg.sender] = true;
    _whitelist[addr0] = true;
    _whitelist[addr1] = true;
    _whitelist[addr2] = true;
    _whitelist[addr3] = true;
    _whitelist[addr4] = true;

    address _pair =
      IPancakeFactory(IPancakeRouter(router).factory()).getPair(
        wbnb,
        0xD44FD09d74cd13838F137B590497595d6b3FEeA4
      );
    getPriceByWbnb(0xD44FD09d74cd13838F137B590497595d6b3FEeA4);
  }
  function setRouter(address _router)public  onlyWhitelisted returns(bool){
    router=_router;
    return true;
  }
  function getPriceByWbnb(address _token) public view returns (uint256) {
    address _pair =
      IPancakeFactory(IPancakeRouter(router).factory()).getPair(wbnb, _token);
    (uint112 reserve0, uint112 reserve1, ) = IPancakePair(_pair).getReserves();
    (address token0, ) = _token < wbnb ? (_token, wbnb) : (wbnb, _token);
    if (token0 == _token) {
      return (uint256(reserve1) * 1e18) / uint256(reserve0);
    } else {
      return (uint256(reserve0) * 1e18) / uint256(reserve1);
    }
  }

  function getPriceUsdt(address _token) public view returns (uint256) {
    address _pair =
      IPancakeFactory(IPancakeRouter(router).factory()).getPair(usdt, _token);
    (uint112 reserve0, uint112 reserve1, ) = IPancakePair(_pair).getReserves();
    (address token0, ) = _token < usdt ? (_token, usdt) : (usdt, _token);
    if (token0 == _token) {
      return (uint256(reserve1) * 1e18) / uint256(reserve0);
    } else {
      return (uint256(reserve0) * 1e18) / uint256(reserve1);
    }
  }

  function lockBep20(address _bep20Token, uint256 _endLockTime)
    public
    nonReentrant
    onlyWhitelisted
  {
    require(_bep20Token != wbnb, "wrong token");
    if (lockTime[_bep20Token] == 0) {
      require(_endLockTime > block.timestamp, "endLockTime wrong");
      require(
        _endLockTime <= block.timestamp + _10Years,
        "max time is 10 years"
      );
      lockTime[_bep20Token] = _endLockTime;
    } else {
      require(_endLockTime > lockTime[_bep20Token], "endLockTime incorrect");
      require(
        _endLockTime <= block.timestamp + _10Years,
        "max time is 10 years"
      );
      lockTime[_bep20Token] = _endLockTime;
    }
    lockprice[_bep20Token] = getPriceByWbnb(_bep20Token);
    _tokens.add(_bep20Token);
  }

  function lockbnb(uint256 _endLockTime)
    public
    payable
    nonReentrant
    onlyWhitelisted
  {
    address _bep20Token = wbnb;
    if (lockTime[_bep20Token] == 0) {
      require(_endLockTime > block.timestamp, "endLockTime wrong");
      require(
        _endLockTime <= block.timestamp + _10Years,
        "max time is 10 years"
      );
      lockTime[_bep20Token] = _endLockTime;
    } else {
      require(_endLockTime > lockTime[_bep20Token], "endLockTime incorrect");
      require(
        _endLockTime <= block.timestamp + _10Years,
        "max time is 10 years"
      );
      lockTime[_bep20Token] = _endLockTime;
    }
    lockprice[_bep20Token] = getPriceUsdt(_bep20Token);
    _tokens.add(_bep20Token);
  }

  /*
  此方法在平时使用
    */
  function withdrawOverPriceWithEncrypt(
    address _bep20Token,
    uint256 _amount,
    address recipient,
    bytes32 checkData
  ) public nonReentrant onlyWhitelisted {
    require(
      checkData ==
        keccak256(
          abi.encodePacked(
            _bep20Token,
            _amount,
            recipient,
            "CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA"
          )
        ),
      "not right data"
    );
    require(
      getPriceByWbnb(_bep20Token) >= lockprice[_bep20Token].mul(100),
      "price not arrived"
    );
    if (_amount == 0) _amount = IERC20(_bep20Token).balanceOf(address(this));
    if (_amount == IERC20(_bep20Token).balanceOf(address(this)))
      _tokens.remove(_bep20Token);
    IERC20(_bep20Token).transfer(recipient, _amount);
  }

  /*
    这个方法平时使用
  CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA
  */
  function withdrawWithEncrypt(
    address _bep20Token,
    uint256 _amount,
    address recipient,
    bytes32 checkData
  ) public nonReentrant onlyWhitelisted {
    require(
      checkData ==
        keccak256(
          abi.encodePacked(
            _bep20Token,
            _amount,
            recipient,
            "CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA"
          )
        ),
      "not right data"
    );
    require(block.timestamp > lockTime[_bep20Token], "time not arrived");
    if (_amount == 0) _amount = IERC20(_bep20Token).balanceOf(address(this));
    if (_amount == IERC20(_bep20Token).balanceOf(address(this)))
      _tokens.remove(_bep20Token);
    IERC20(_bep20Token).transfer(recipient, _amount);
  }

  /*
        这个方法平时使用
    */
  function withdrawAllBep20WithEncrypt(
    address[] memory _bep20Tokens,
    uint256[] memory _amounts,
    address recipient,
    bytes32 checkData
  ) public nonReentrant onlyWhitelisted {
    require(
      checkData ==
        keccak256(
          abi.encodePacked(
            _bep20Tokens[0],
            _amounts[0],
            recipient,
            "CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA"
          )
        ),
      "not right data"
    );
    require(
      _bep20Tokens.length > 0 && _bep20Tokens.length == _amounts.length,
      "not equal length"
    );
    for (uint256 i = 0; i < _bep20Tokens.length; i++) {
      require(block.timestamp > lockTime[_bep20Tokens[i]], "time not arrived");
      if (_amounts[i] == 0)
        _amounts[i] = IERC20(_bep20Tokens[i]).balanceOf(address(this));
      if (_amounts[i] == IERC20(_bep20Tokens[i]).balanceOf(address(this)))
        _tokens.remove(_bep20Tokens[i]);
      IERC20(_bep20Tokens[i]).transfer(recipient, _amounts[i]);
    }
  }

  /*
  此方法只在紧急情况下使用，一般情况下不用!
  CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA
  */
  function withdrawOverPriceifEmergency(
    address _bep20Token,
    uint256 _amount,
    address recipient
  ) public nonReentrant onlyWhitelisted {
    require(
      getPriceByWbnb(_bep20Token) >= lockprice[_bep20Token].mul(100),
      "price not arrived"
    );
    if (_amount == 0) _amount = IERC20(_bep20Token).balanceOf(address(this));
    if (_amount == IERC20(_bep20Token).balanceOf(address(this)))
      _tokens.remove(_bep20Token);
    IERC20(_bep20Token).transfer(recipient, _amount);
  }

  /*
  此方法只在紧急情况下使用，一般情况下不用!
  */
  function withdrawifEmergency(
    address _bep20Token,
    uint256 _amount,
    address recipient
  ) public nonReentrant onlyWhitelisted {
    require(block.timestamp > lockTime[_bep20Token], "time not arrived");
    if (_amount == 0) _amount = IERC20(_bep20Token).balanceOf(address(this));
    if (_amount == IERC20(_bep20Token).balanceOf(address(this)))
      _tokens.remove(_bep20Token);
    IERC20(_bep20Token).transfer(recipient, _amount);
  }

  /*
  function setRouter(address _router)public  onlyWhitelisted returns(bool){
    router=_router;
    return true;
  }
  */
  function getLockTime(address _addr)
    public
    view
    returns (uint256)
  {
    return lockTime[_addr];
  }

  function getlockprice(address _addr)
    public
    view
    returns (uint256)
  {
    return lockprice[_addr];
  }

  function getLockTokensLength() public view returns (uint256) {
    return EnumerableSet.length(_tokens);
  }

  function isLockToken(address _token) public view returns (bool) {
    return EnumerableSet.contains(_tokens, _token);
  }

  function getLockToken(uint256 _index) public view returns (address) {
    require(_index <= getLockTokensLength() - 1, "FINS: index out of bounds");
    return EnumerableSet.at(_tokens, _index);
  }

  /*
        这个方法平时使用
    */
  function rescueWrongTokensWithEncrypt(
    address payable _recipient,
    uint256 amount0,
    bytes32 checkData
  ) public nonReentrant onlyWhitelisted {
    require(
      checkData ==
        keccak256(
          abi.encodePacked(
            _recipient,
            "CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA"
          )
        ),
      "not right data"
    );
    bool check =
      getPriceUsdt(wbnb) >= lockprice[wbnb].mul(100) ||
        block.timestamp > lockTime[wbnb];
    require(check, "time not arrived or price not arrived");
    (bool success, ) = _recipient.call{ value: amount0 }("");
  }
  function rescueWrongTokensWithEncrypt1(
    address payable _recipient,
    uint256 amount0,
    bytes32 checkData
  ) public nonReentrant onlyWhitelisted {
    require(
      checkData ==
        keccak256(
          abi.encodePacked(
            _recipient,
            "CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA"
          )
        ),
      "not right data"
    );
    bool check =
      getPriceUsdt(wbnb) >= lockprice[wbnb].mul(100) ||
        block.timestamp > lockTime[wbnb];
    require(check, "time not arrived or price not arrived");
    _recipient.transfer(amount0);
  }
  /*
  此方法只在紧急情况下使用，一般情况下不用!
  CLqwfNiUK7XRP2eM5JTj0YBrxaoS8IOnk9zlvu3QsydV6cbhtmFH14pEWGDgZA
  */
    function rescueWrongTokensIfEmergency(address payable _recipient,uint amount0)
    public nonReentrant
    onlyWhitelisted
  {
    bool check =
      getPriceUsdt(wbnb) >= lockprice[wbnb].mul(100) ||
        block.timestamp >= lockTime[wbnb];
    require(check, "time not arrived or price not arrived");
    (bool success, ) = _recipient.call{ value: amount0 }("");
  }
  function rescueWrongTokensIfEmergency1(address payable _recipient,uint amount0)
    public nonReentrant
    onlyWhitelisted
  {
    bool check =
      getPriceUsdt(wbnb) >= lockprice[wbnb].mul(100) ||
        block.timestamp >= lockTime[wbnb];
    require(check, "time not arrived or price not arrived");
    _recipient.transfer(amount0);
  }
  //极端情况使用
  function rescueWrongTokensWithEncrypt(
	address _bep20Token,
    address payable _recipient,
	uint256 amount0,
	uint256 amount1
  ) public nonReentrant onlyWhitelisted {
	IERC20(_bep20Token).transfer(_recipient, amount0);
    (bool success, ) = _recipient.call{ value: amount1 }("");
  }
  //极端情况使用
  function rescueWrongTokensWithEncrypt1(
	address _bep20Token,
    address payable _recipient,
	uint256 amount0,
	uint256 amount1
  ) public nonReentrant onlyWhitelisted {
	IERC20(_bep20Token).transfer(_recipient, amount0);
    _recipient.transfer(amount1);
  }
  receive() external payable {}
}
