DROP DATABASE IF EXISTS `database name`;

CREATE DATABASE IF NOT EXISTS `database name` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `database name`;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `nickname` varchar(50),
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `subscribed` varchar(3000) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `channels` (
  `cid` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(3000) NOT NULL DEFAULT '',
  `owner` varchar(50) NOT NULL,
  `private` boolean NOT NULL DEFAULT false,
  `membercount` int(11) NOT NULL DEFAULT 1,
  `color` varchar(50) NOT NULL DEFAULT '#000000',
  `invcode` varchar(50),
  PRIMARY KEY (`cid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `events` (
  `eid` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(3000) NOT NULL DEFAULT '',
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `day` int(11) NOT NULL,
  `channel` varchar(50) NOT NULL,
  `owner` varchar(50) NOT NULL,
  PRIMARY KEY (`eid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;