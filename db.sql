/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 100420
 Source Host           : localhost:3306
 Source Schema         : multi-ip

 Target Server Type    : MySQL
 Target Server Version : 100420
 File Encoding         : 65001

 Date: 31/03/2022 00:46:59
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for clients
-- ----------------------------
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `server_id` int NULL DEFAULT NULL,
  `client_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NULL DEFAULT NULL,
  `con_time` datetime NULL DEFAULT NULL,
  `dis_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of clients
-- ----------------------------

-- ----------------------------
-- Table structure for connect_status
-- ----------------------------
DROP TABLE IF EXISTS `connect_status`;
CREATE TABLE `connect_status`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `server_id` int NULL DEFAULT NULL,
  `con_time` datetime NULL DEFAULT NULL,
  `dis_time` datetime NULL DEFAULT NULL,
  `status` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8 COLLATE = utf8_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of connect_status
-- ----------------------------
INSERT INTO `connect_status` VALUES (30, 27, '2022-03-31 00:46:24', '2022-03-31 00:46:22', 0);

-- ----------------------------
-- Table structure for servers
-- ----------------------------
DROP TABLE IF EXISTS `servers`;
CREATE TABLE `servers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NULL DEFAULT NULL,
  `port` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8 COLLATE = utf8_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of servers
-- ----------------------------
INSERT INTO `servers` VALUES (27, '127.0.0.1', '5000');

-- ----------------------------
-- Procedure structure for newServerAdd
-- ----------------------------
DROP PROCEDURE IF EXISTS `newServerAdd`;
delimiter ;;
CREATE PROCEDURE `newServerAdd`(IN ip_address VARCHAR(255),
	IN port_number VARCHAR(255))
BEGIN
	IF( SELECT EXISTS ( SELECT * FROM servers WHERE ip=ip_address and port=port_number )) THEN
		SELECT 'EXISTS';
	ELSE
		INSERT INTO servers (ip, port)
			VALUES (ip_address, port_number);
	END IF;
END
;;
delimiter ;

-- ----------------------------
-- Procedure structure for updateServerStatus
-- ----------------------------
DROP PROCEDURE IF EXISTS `updateServerStatus`;
delimiter ;;
CREATE PROCEDURE `updateServerStatus`(IN
	server_idx INT,
	status_id INT)
BEGIN
	IF( SELECT EXISTS ( SELECT * FROM connect_status WHERE server_id=server_idx )) THEN
		IF ( status_id = 0 ) THEN
			UPDATE connect_status
			SET
				con_time = NOW(),
				status = status_id
			WHERE
				server_id = server_idx;
		ELSE
			UPDATE connect_status
			SET
				dis_time = NOW()
			WHERE
				server_id = server_idx;
		END IF;
	ELSE
		INSERT INTO connect_status (server_id, con_time, status)
			VALUES (server_idx, NOW(), status_id);
	END IF;
	
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
