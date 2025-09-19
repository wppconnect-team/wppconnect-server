import ChatwootClient from '../../util/chatWootClient';

describe('Utils Functions', function () {
  describe('Chatwoot client', function () {
    it('Should transform BR number and add 9', function () {
      const result = ChatwootClient.normalizeBrazillianNumber('+557199278378');
      expect(result).toEqual('+5571999278378');
    });

    it('Should transform BR number and keep as extra 9', function () {
      const result = ChatwootClient.normalizeBrazillianNumber('+5571999278378');
      expect(result).toEqual('+5571999278378');
    });

    it('Should transform BR number without +', function () {
      const result = ChatwootClient.normalizeBrazillianNumber('5571999278378');
      expect(result).toEqual('+5571999278378');
    });

    it('Should transform international number with +', function () {
      const result = ChatwootClient.normalizeBrazillianNumber('+14076808604');
      expect(result).toEqual('+14076808604');
    });

    it('Should transform international number withthout +', function () {
      const result = ChatwootClient.normalizeBrazillianNumber('14076808604');
      expect(result).toEqual('+14076808604');
    });
  });
});
