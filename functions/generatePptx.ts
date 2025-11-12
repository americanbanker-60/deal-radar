/**
 * Generate PowerPoint presentation
 * Returns: { fileUrl: string }
 */
export default async function generatePptx({ title, slides }, { integrations }) {
  const PptxGenJS = await import('pptxgenjs');
  const pptx = new PptxGenJS.default();
  
  pptx.defineLayout({ name: 'Widescreen', width: 13.33, height: 7.5 });
  pptx.layout = 'Widescreen';
  
  // Add title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(title, { x: 1, y: 1.2, fontSize: 32, bold: true });
  titleSlide.addText('Generated from Ops Console', { x: 1, y: 2.0, fontSize: 16, color: '666666' });
  
  // Add content slides
  slides.forEach(slideData => {
    const slide = pptx.addSlide();
    slide.addText(slideData.title, { x: 1, y: 0.8, fontSize: 26, bold: true });
    
    if (slideData.content) {
      slide.addText(slideData.content, { x: 1, y: 1.6, fontSize: 16 });
    }
    
    if (slideData.bullets) {
      const bulletText = slideData.bullets.map(b => `• ${b}`).join('\n');
      slide.addText(bulletText, { x: 1, y: 1.6, fontSize: 16 });
    }
  });
  
  // Generate buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  
  // Upload to storage
  const file = new File([buffer], `${title.toLowerCase().replace(/\s+/g, '_')}.pptx`, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
  
  const { file_url } = await integrations.Core.UploadFile({ file });
  
  return { fileUrl: file_url };
}