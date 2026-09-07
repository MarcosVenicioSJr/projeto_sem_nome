import type { Catalog } from '../types.js';

export const ptBR: Catalog = {
  // ── Validação genérica ─────────────────────────────────────────────
  'validation.invalid': 'Valor inválido',
  'validation.invalidType': 'Tipo inválido',
  'validation.required': 'Campo obrigatório',
  'validation.field.required': 'Campo obrigatório',
  'validation.string.tooShort': 'Use ao menos {minimum} caracteres',
  'validation.string.tooLong': 'Use no máximo {maximum} caracteres',
  'validation.number.tooSmall': 'Deve ser ao menos {minimum}',
  'validation.number.tooBig': 'Deve ser no máximo {maximum}',
  'validation.array.tooSmall': 'Selecione ao menos {minimum}',
  'validation.array.tooBig': 'Selecione no máximo {maximum}',
  'validation.format.email': 'E-mail inválido',
  'validation.format.uuid': 'Identificador inválido',
  'validation.format.datetime': 'Data/hora inválida',
  'validation.format.date': 'Data inválida',
  'validation.format.regex': 'Formato inválido',
  'validation.notMultipleOf': 'Deve ser múltiplo de {divisor}',
  'validation.unrecognizedKeys': 'Campos não esperados',
  'validation.invalidValue': 'Valor não permitido',
  'validation.invalidUnion': 'Valor inválido',

  // ── Validação por campo ────────────────────────────────────────────
  'validation.name.tooShort': 'Informe seu nome',
  'validation.username.pattern':
    'Comece com letra e use apenas letras, números, "." e "_" (sem ".." ou "." no fim)',
  'validation.password.minLength': 'Use ao menos 8 caracteres',
  'validation.password.uppercase': 'Inclua uma letra maiúscula',
  'validation.password.lowercase': 'Inclua uma letra minúscula',
  'validation.password.number': 'Inclua um número',
  'validation.otp.length': 'Digite o código de 6 dígitos',
  'validation.birthDate.future': 'A data não pode ser no futuro',
  'validation.birthDate.minAge': 'Você precisa ter ao menos 18 anos',
  'validation.genres.duplicate': 'Remova os gêneros repetidos',
  'validation.terms.required':
    'É preciso aceitar os Termos e a Política de Privacidade',

  // ── Erros de domínio (API) ────────────────────────────────────────
  'errors.auth.usernameTaken': 'Usuário já está em uso',
  'errors.auth.emailTaken': 'E-mail já cadastrado',
  'errors.auth.invalidCredentials': 'Usuário ou senha incorretos',
  'errors.auth.accountBlocked':
    'Conta bloqueada. Use "Esqueci minha senha" para desbloquear.',
  'errors.auth.codeInvalidOrExpired': 'Código incorreto ou expirado',
  'errors.auth.codeIncorrect': 'Código incorreto. Tentativas restantes: {remaining}',
  'errors.auth.registrationNotFound': 'Cadastro não encontrado',
  'errors.auth.tokenMissing': 'Token de acesso ausente',
  'errors.auth.tokenInvalid': 'Token inválido ou expirado',
  'errors.user.notFound': 'Usuário não encontrado',
  'errors.internal': 'Algo deu errado',
  'errors.validationFailed': 'Falha na validação',

  // ── E-mail transacional ──────────────────────────────────────────
  'email.verification.subject': 'Seu código de confirmação · Marginália',
  'email.verification.line1': 'Seu código de confirmação é:',
  'email.verification.line2': 'Ele expira em 5 minutos.',

  // ── Rótulos de gênero ────────────────────────────────────────────
  'genre.romance': 'Romance',
  'genre.suspense': 'Suspense',
  'genre.ficcao-brasileira': 'Ficção brasileira',
  'genre.fantasia': 'Fantasia',
  'genre.biografia': 'Biografia',
  'genre.classicos': 'Clássicos',
  'genre.poesia': 'Poesia',
  'genre.nao-ficcao': 'Não-ficção',
  'genre.autoajuda': 'Autoajuda',
  'genre.terror': 'Terror',
  'genre.policial': 'Policial',
  'genre.quadrinhos': 'Quadrinhos',
};
