// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MTPValidationNFT
 * @notice ERC-721 mínimo autocontenido para certificados MTP en ETTIOS Blockchain.
 *         Sin dependencias externas (no requiere OpenZeppelin) — compilable directo en Remix.
 */
contract MTPValidationNFT {
    string  public name   = "MTP Validation Certificate";
    string  public symbol = "MTPV";

    uint256 private _tokenIdCounter = 0;
    address public owner;
    mapping(address => bool) public minters;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string)  private _tokenURIs;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event MinterUpdated(address indexed account, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "MTP: not owner");
        _;
    }
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner, "MTP: not minter");
        _;
    }

    constructor() {
        owner = msg.sender;
        minters[msg.sender] = true;
        emit MinterUpdated(msg.sender, true);
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        minters[account] = allowed;
        emit MinterUpdated(account, allowed);
    }

    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function balanceOf(address account) public view returns (uint256) {
        require(account != address(0), "MTP: zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address o = _owners[tokenId];
        require(o != address(0), "MTP: nonexistent token");
        return o;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "MTP: nonexistent token");
        return _tokenURIs[tokenId];
    }

    function safeMint(address to, string memory uri) external onlyMinter returns (uint256) {
        require(to != address(0), "MTP: mint to zero");
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;

        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenURIs[tokenId] = uri;

        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function approve(address to, uint256 tokenId) external {
        address o = ownerOf(tokenId);
        require(msg.sender == o || _operatorApprovals[o][msg.sender], "MTP: not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(o, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "MTP: nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address acc, address operator) external view returns (bool) {
        return _operatorApprovals[acc][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isAuthorized(msg.sender, tokenId), "MTP: not authorized");
        require(ownerOf(tokenId) == from, "MTP: wrong from");
        require(to != address(0), "MTP: transfer to zero");

        _tokenApprovals[tokenId] = address(0);
        _balances[from] -= 1;
        _balances[to]   += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        transferFrom(from, to, tokenId);
    }

    function _isAuthorized(address spender, uint256 tokenId) internal view returns (bool) {
        address o = ownerOf(tokenId);
        return (spender == o || _tokenApprovals[tokenId] == spender || _operatorApprovals[o][spender]);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd  // ERC721
            || interfaceId == 0x5b5e139f  // ERC721Metadata
            || interfaceId == 0x01ffc9a7; // ERC165
    }
}
