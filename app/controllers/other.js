"use strict";
/**
 * その他コントローラー
 *
 * @namespace OtherController
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 環境変数リストを出力する
 *
 * @memberOf OtherController
 */
// tslint:disable-next-line:variable-name
function environmentVariables(_req, res) {
    res.json({
        success: true,
        variables: process.env
    });
}
exports.environmentVariables = environmentVariables;