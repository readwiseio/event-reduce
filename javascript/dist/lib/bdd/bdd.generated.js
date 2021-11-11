"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInput = exports.getSimpleBdd = exports.minimalBddString = void 0;
var binary_decision_diagram_1 = require("binary-decision-diagram");
var states_1 = require("../states");
exports.minimalBddString = '14a2b0c/d,e+f5g1h.i4j*k-l)m(n6ocf3pbf3qaf3rbn3scn3tkn3unb5viu0wpr0xgn0yfn0zdn0{en0|kn0}lh0~in0jm0¡iv+¢k|+£pw+¤gx+¥fy+¦dz+§e{+¨l}+©i~+ªj+«kt,¬kn,­§n,®¢n,¯en,°hk,±¨k,²ªm,³§o:´¯«:µ¦h:¶§f:·¯¬:¸m¡:¹­m:º¤q:»¤n:¼¦£:½§s:¾¯t:¿¤f:Àgn:Á¦¥:Â¦n:Ã§n:Ä¯n:Åm°:Æm±:Çml:Èm©:Ém²:Êmn:Ë¤§1Ì¦¯1Í¿³1Îµ´1Ï¿¶1Ðµ·1Ñ»½1ÒÂ¾1ÓÀÃ1ÔÂÄ1Õmn-ÖÈ¸-×ÍÑ-ØÎÒ-ÙÈÊ-ÚÉÊ-ÛÆn-ÜÏÓ-ÝÐÔ-ÞÅÊ-ßÆÊ-àÇÊ-ám­9âÖn9ãÉm9äß¹9åÉ®9æmn9çmÞ9èàm9éám6êâæ6ëåã6ìäç6íéÕ/îêÙ/ïëÚ/ðìÛ/ñº¿/ò×Ü/ó¼Á/ôØÝ/õèà/öËÌ2÷¥ó2ø¢ô2ùîð7úñò7û÷ø7üÈß7ýüí*þàm*ÿýÉ8Āùï8āúû8ĂÿĀ)ăöā)Ąþõ)ąĂă4ąĄ.';
var simpleBdd;
function getSimpleBdd() {
    if (!simpleBdd) {
        simpleBdd = (0, binary_decision_diagram_1.minimalStringToSimpleBdd)(exports.minimalBddString);
    }
    return simpleBdd;
}
exports.getSimpleBdd = getSimpleBdd;
var resolveInput = function (input) {
    return (0, binary_decision_diagram_1.resolveWithSimpleBdd)(getSimpleBdd(), states_1.stateResolveFunctionByIndex, input);
};
exports.resolveInput = resolveInput;
//# sourceMappingURL=bdd.generated.js.map