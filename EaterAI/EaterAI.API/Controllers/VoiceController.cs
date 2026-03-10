using EaterAI.API.Services;
using EaterAI.Shared.DTOs.Voice;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EaterAI.API.Controllers;

[ApiController]
[Route("api/voice")]
[Authorize]
public class VoiceController : ControllerBase
{
    private readonly IVoiceService _voiceService;

    public VoiceController(IVoiceService voiceService) => _voiceService = voiceService;

    [HttpPost("transcribe")]
    public async Task<IActionResult> Transcribe([FromBody] TranscribeRequest request)
    {
        var transcript = await _voiceService.TranscribeAsync(request.AudioBase64, request.Encoding, request.Language);
        return Ok(new TranscribeResponse { Transcript = transcript });
    }

    [HttpPost("synthesize")]
    public async Task<IActionResult> Synthesize([FromBody] SynthesizeRequest request)
    {
        var audioBase64 = await _voiceService.SynthesizeAsync(request.Text, request.Language);
        return Ok(new SynthesizeResponse { AudioBase64 = audioBase64 });
    }
}
