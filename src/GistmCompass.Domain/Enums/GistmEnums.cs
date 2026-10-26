namespace GistmCompass.Domain.Enums;

public enum UserRole
{
    ADMIN,
    MEMBER
}

public enum FinalClassification
{
    ATENDE_TOTALMENTE,
    ATENDE_PARCIALMENTE,
    NAO_ATENDE,
    NAO_SE_APLICA
}

public enum EvidenceRobustness
{
    ROBUSTA,
    PARCIAL,
    FRACA,
    AUSENTE
}

public enum GapCriticality
{
    ALTA,
    MEDIA,
    BAIXA,
    NAO_SE_APLICA
}

public enum ReviewStatus
{
    SUGESTAO_IA,
    EM_REVISAO,
    VALIDADO
}

public enum InfoSufficiency
{
    SUFICIENTE,
    INSUFICIENTE
}

public enum ActionStatus
{
    ABERTA,
    EM_ANDAMENTO,
    CONCLUIDA
}

public enum ActionPriority
{
    ALTA,
    MEDIA,
    BAIXA
}

public enum JobStatus
{
    PENDING,
    RUNNING,
    DONE,
    FAILED
}

public enum JobType
{
    TextExtraction,
    AiAssessment,
    AiAssessmentBatch,
    AiChat
}
